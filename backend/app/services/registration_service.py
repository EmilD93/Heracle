from __future__ import annotations

from sqlalchemy import text

from backend.app.services.notification_service import create_notification_job


def register_student_for_event(
    db,
    *,
    student_id: str,
    event_id: str,
):
    """
    Registers a student for an event.

    After successful registration, it creates a notification job.

    Acceptance criteria:
    - registrations gets a new row
    - notification_jobs gets a new pending row
    """

    try:
        event = db.execute(
            text(
                """
                SELECT id, title, capacity, status
                FROM events
                WHERE id = :event_id;
                """
            ),
            {"event_id": event_id},
        ).mappings().first()

        if event is None:
            raise ValueError("Event not found")

        if event["status"] != "PUBLISHED":
            raise ValueError("Event is not open for registration")

        existing_registration = db.execute(
            text(
                """
                SELECT id
                FROM registrations
                WHERE student_id = :student_id
                  AND event_id = :event_id
                  AND status != 'CANCELLED';
                """
            ),
            {
                "student_id": student_id,
                "event_id": event_id,
            },
        ).mappings().first()

        if existing_registration is not None:
            raise ValueError("Student is already registered for this event")

        confirmed_count = db.execute(
            text(
                """
                SELECT COUNT(*)
                FROM registrations
                WHERE event_id = :event_id
                  AND status = 'CONFIRMED';
                """
            ),
            {"event_id": event_id},
        ).scalar_one()

        if confirmed_count < event["capacity"]:
            registration_status = "CONFIRMED"
            waitlist_position = None
            notification_type = "RegistrationConfirmed"
            notification_message = "Your registration has been confirmed."
        else:
            registration_status = "WAITLISTED"

            waitlist_position = db.execute(
                text(
                    """
                    SELECT COALESCE(MAX(position), 0) + 1
                    FROM registrations
                    WHERE event_id = :event_id
                      AND status = 'WAITLISTED';
                    """
                ),
                {"event_id": event_id},
            ).scalar_one()

            notification_type = "RegistrationWaitlisted"
            notification_message = "You have been added to the waitlist."

        registration = db.execute(
            text(
                """
                INSERT INTO registrations (
                    student_id,
                    event_id,
                    status,
                    position
                )
                VALUES (
                    :student_id,
                    :event_id,
                    :status,
                    :position
                )
                RETURNING id, student_id, event_id, status, position, created_at;
                """
            ),
            {
                "student_id": student_id,
                "event_id": event_id,
                "status": registration_status,
                "position": waitlist_position,
            },
        ).mappings().one()

        notification_job_id = create_notification_job(
            db=db,
            notification_type=notification_type,
            user_id=student_id,
            event_id=event_id,
            registration_id=registration["id"],
            payload={
                "message": notification_message,
                "registration_id": str(registration["id"]),
                "event_id": str(event_id),
                "student_id": str(student_id),
                "status": registration_status,
                "event_title": event["title"],
            },
        )

        db.commit()

        return {
            "registration_id": str(registration["id"]),
            "student_id": str(registration["student_id"]),
            "event_id": str(registration["event_id"]),
            "status": registration["status"],
            "position": registration["position"],
            "created_at": registration["created_at"],
            "notification_job_id": str(notification_job_id),
        }

    except Exception:
        db.rollback()
        raise