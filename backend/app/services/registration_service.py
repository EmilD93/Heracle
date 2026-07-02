from __future__ import annotations

from app.services.notification_service import create_notification_job


def _reindex_waitlist_positions(db, event_id: str) -> None:
    """Keep waitlist positions contiguous after cancellations/promotions."""

    waitlisted = db.execute(
        """
        SELECT id
        FROM registrations
        WHERE event_id = %s AND status = 'WAITLISTED'
        ORDER BY position ASC NULLS LAST, created_at ASC
        """,
        (event_id,),
    ).fetchall()

    for index, reg in enumerate(waitlisted, start=1):
        db.execute(
            "UPDATE registrations SET position = %s WHERE id = %s",
            (index, reg["id"]),
        )


def register_student_for_event(db, *, student_id: str, event_id: str) -> dict:
    """Register a student for a published event with confirmed/waitlist logic."""

    try:
        event = db.execute(
            "SELECT id, title, capacity, status, organizer_id FROM events WHERE id = %s",
            (event_id,),
        ).fetchone()

        if not event:
            raise ValueError("Event not found")

        if event["status"] != "PUBLISHED":
            raise ValueError("Event is not open for registration")

        if event.get("organizer_id") and str(event["organizer_id"]) == str(student_id):
            raise ValueError("You cannot register for your own event")

        existing = db.execute(
            """
            SELECT id
            FROM registrations
            WHERE student_id = %s AND event_id = %s AND status != 'CANCELLED'
            """,
            (student_id, event_id),
        ).fetchone()
        if existing:
            raise ValueError("Student is already registered for this event")

        confirmed_count = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM registrations
            WHERE event_id = %s AND status = 'CONFIRMED'
            """,
            (event_id,),
        ).fetchone()["count"]

        if confirmed_count < event["capacity"]:
            status = "CONFIRMED"
            position = None
            notification_type = "RegistrationConfirmed"
        else:
            status = "WAITLISTED"
            next_position = db.execute(
                """
                SELECT COALESCE(MAX(position), 0) + 1 AS next_position
                FROM registrations
                WHERE event_id = %s AND status = 'WAITLISTED'
                """,
                (event_id,),
            ).fetchone()["next_position"]
            position = int(next_position)
            notification_type = "RegistrationWaitlisted"

        registration = db.execute(
            """
            INSERT INTO registrations (student_id, event_id, status, position)
            VALUES (%s, %s, %s, %s)
            RETURNING id, student_id, event_id, status, position, created_at
            """,
            (student_id, event_id, status, position),
        ).fetchone()

        job_id = create_notification_job(
            db,
            notification_type=notification_type,
            user_id=student_id,
            event_id=event_id,
            registration_id=str(registration["id"]),
            payload={
                "registration_id": str(registration["id"]),
                "event_id": str(event_id),
                "student_id": str(student_id),
                "status": status,
            },
        )

        db.commit()

        return {
            "registration_id": str(registration["id"]),
            "student_id": str(registration["student_id"]),
            "event_id": str(registration["event_id"]),
            "status": registration["status"],
            "position": registration["position"],
            "created_at": str(registration["created_at"]),
            "notification_job_id": job_id,
        }
    except Exception:
        db.rollback()
        raise


def cancel_registration(db, *, registration_id: str) -> dict:
    """Cancel registration and promote first waitlisted entry when needed."""

    try:
        registration = db.execute(
            """
            SELECT id, student_id, event_id, status
            FROM registrations
            WHERE id = %s
            """,
            (registration_id,),
        ).fetchone()

        if not registration:
            raise ValueError("Registration not found")

        if registration["status"] == "CANCELLED":
            return {
                "cancelled_registration_id": str(registration["id"]),
                "status": "already_cancelled",
                "promoted_registration": None,
            }

        was_confirmed = registration["status"] == "CONFIRMED"

        db.execute(
            "UPDATE registrations SET status = 'CANCELLED' WHERE id = %s",
            (registration_id,),
        )

        promoted = None
        if was_confirmed:
            first_waitlisted = db.execute(
                """
                SELECT id, student_id, event_id, position
                FROM registrations
                WHERE event_id = %s AND status = 'WAITLISTED'
                ORDER BY position ASC NULLS LAST, created_at ASC
                LIMIT 1
                """,
                (registration["event_id"],),
            ).fetchone()

            if first_waitlisted:
                db.execute(
                    """
                    UPDATE registrations
                    SET status = 'CONFIRMED', position = NULL
                    WHERE id = %s
                    """,
                    (first_waitlisted["id"],),
                )

                create_notification_job(
                    db,
                    notification_type="WaitlistPromoted",
                    user_id=str(first_waitlisted["student_id"]),
                    event_id=str(first_waitlisted["event_id"]),
                    registration_id=str(first_waitlisted["id"]),
                    payload={
                        "registration_id": str(first_waitlisted["id"]),
                        "event_id": str(first_waitlisted["event_id"]),
                        "student_id": str(first_waitlisted["student_id"]),
                        "previous_position": first_waitlisted["position"],
                        "status": "CONFIRMED",
                    },
                )

                promoted = {
                    "registration_id": str(first_waitlisted["id"]),
                    "student_id": str(first_waitlisted["student_id"]),
                    "event_id": str(first_waitlisted["event_id"]),
                    "status": "CONFIRMED",
                }

            _reindex_waitlist_positions(db, str(registration["event_id"]))

        db.commit()

        return {
            "cancelled_registration_id": str(registration["id"]),
            "status": "cancelled",
            "promoted_registration": promoted,
        }
    except Exception:
        db.rollback()
        raise