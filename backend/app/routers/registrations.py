from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.services.registration_service import register_student_for_event, cancel_registration
from app.services.notification_service import ensure_notification_schema

router = APIRouter()

from app.routers.auth import get_current_user

class OrganizerKickRequest(BaseModel):
    organizerEmail: str


def ensure_user_profile_columns(db):
    db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT")


def ensure_notification_seen_column(db):
    ensure_notification_schema(db)


@router.get("/event/{event_id}")
def get_event_registrations(event_id: str, db=Depends(get_db)):
    ensure_user_profile_columns(db)
    event = db.execute("SELECT id FROM events WHERE id = %s", (event_id,)).fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    rows = db.execute(
        """
        SELECT r.id,
               r.student_id,
               r.status,
               r.position,
               r.created_at,
               u.first_name,
               u.last_name,
             u.email,
             u.profile_photo_url
        FROM registrations r
        JOIN users u ON u.id = r.student_id
        WHERE r.event_id = %s
        ORDER BY
          CASE WHEN r.status = 'CONFIRMED' THEN 0 WHEN r.status = 'WAITLISTED' THEN 1 ELSE 2 END,
          r.position ASC NULLS LAST,
          r.created_at ASC
        """,
        (event_id,),
    ).fetchall()

    items = []
    for row in rows:
        items.append({
            "registrationId": str(row["id"]),
            "userId": str(row["student_id"]),
            "fullName": f"{row['first_name']} {row['last_name']}",
            "email": row["email"],
            "profilePhotoUrl": row.get("profile_photo_url"),
            "status": row["status"],
            "position": row["position"],
            "createdAt": str(row["created_at"]),
        })

    return {
        "eventId": event_id,
        "count": len(items),
        "items": items,
    }


@router.get("/event/{event_id}/user/{user_email}")
def get_user_registration_for_event(event_id: str, user_email: str, db=Depends(get_db)):
    row = db.execute(
        """
        SELECT r.id,
               r.student_id,
               r.event_id,
               r.status,
               r.position,
               r.created_at,
               u.email
        FROM registrations r
        JOIN users u ON u.id = r.student_id
        WHERE r.event_id = %s
          AND u.email = %s
          AND r.status != 'CANCELLED'
        ORDER BY r.created_at DESC
        LIMIT 1
        """,
        (event_id, user_email),
    ).fetchone()

    if not row:
        return {"ok": True, "registration": None}

    return {
        "ok": True,
        "registration": {
            "id": str(row["id"]),
            "userEmail": row["email"],
            "eventId": str(row["event_id"]),
            "status": row["status"],
            "position": row["position"],
            "createdAt": str(row["created_at"]),
        },
    }


@router.get("/user/{user_email}")
def get_user_registrations(user_email: str, db=Depends(get_db)):
    rows = db.execute(
        """
        SELECT r.id,
               r.student_id,
               r.event_id,
               r.status,
               r.position,
               r.created_at,
               u.email
        FROM registrations r
        JOIN users u ON u.id = r.student_id
        WHERE u.email = %s
          AND r.status != 'CANCELLED'
        ORDER BY r.created_at DESC
        """,
        (user_email,),
    ).fetchall()

    items = [
        {
            "id": str(row["id"]),
            "userEmail": row["email"],
            "eventId": str(row["event_id"]),
            "status": row["status"],
            "position": row["position"],
            "createdAt": str(row["created_at"]),
        }
        for row in rows
    ]

    return {"ok": True, "count": len(items), "items": items}


@router.get("/notifications/{user_email}")
def get_user_notifications(user_email: str, db=Depends(get_db)):
    ensure_notification_seen_column(db)
    rows = db.execute(
        """
        SELECT nj.id,
               nj.type,
               nj.status,
               nj.created_at,
               nj.completed_at,
               nj.seen_at,
               nj.scheduled_for,
               nj.error_message,
               e.title AS event_title,
               COALESCE(nl.message, '') AS message
        FROM notification_jobs nj
        JOIN users u ON u.id = nj.user_id
        LEFT JOIN events e ON e.id = nj.event_id
        LEFT JOIN LATERAL (
            SELECT message
            FROM notification_logs
            WHERE job_id = nj.id
            ORDER BY sent_at DESC
            LIMIT 1
        ) nl ON TRUE
        WHERE u.email = %s
        ORDER BY COALESCE(nj.completed_at, nj.created_at) DESC
        LIMIT 30
        """,
        (user_email,),
    ).fetchall()

    items = [
        {
            "id": str(row["id"]),
            "type": row["type"],
            "status": row["status"],
            "eventTitle": row.get("event_title"),
            "message": row.get("message") or row.get("error_message") or "",
            "createdAt": str(row["created_at"]),
            "seenAt": str(row["seen_at"]) if row.get("seen_at") else None,
            "scheduledFor": str(row["scheduled_for"]),
            "completedAt": str(row["completed_at"]) if row.get("completed_at") else None,
        }
        for row in rows
    ]

    return {"ok": True, "count": len(items), "items": items}


@router.post("/notifications/{user_email}/seen")
def mark_user_notifications_seen(user_email: str, db=Depends(get_db)):
    ensure_notification_seen_column(db)

    user = db.execute("SELECT id FROM users WHERE email = %s", (user_email,)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = db.execute(
        """
        UPDATE notification_jobs
        SET seen_at = NOW()
        WHERE user_id = %s
          AND seen_at IS NULL
        RETURNING id
        """,
        (user["id"],),
    ).fetchall()
    db.commit()

    return {"ok": True, "markedCount": len(result)}

@router.post("/{event_id}/register")
def register(event_id: str, current_user=Depends(get_current_user), db = Depends(get_db)):
    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (current_user["email"],)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        service_result = register_student_for_event(
            db,
            student_id=str(user["id"]),
            event_id=event_id,
        )

        return {
            "ok": True,
            "registration": {
                "id": service_result["registration_id"],
                "userEmail": current_user["email"],
                "eventId": service_result["event_id"],
                "status": service_result["status"],
                "position": service_result["position"],
                "createdAt": service_result["created_at"],
            },
            "notificationJobId": service_result["notification_job_id"],
        }
    except ValueError as e:
        message = str(e)
        if message == "Event not found":
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=400, detail=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{event_id}/unregister")
def unregister_from_event(event_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    registration = db.execute(
        """
        SELECT r.id
        FROM registrations r
        JOIN users u ON u.id = r.student_id
        WHERE r.event_id = %s
          AND u.email = %s
          AND r.status != 'CANCELLED'
        ORDER BY r.created_at DESC
        LIMIT 1
        """,
        (event_id, current_user["email"]),
    ).fetchone()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    try:
        result = cancel_registration(db, registration_id=str(registration["id"]))
        return {
            "ok": True,
            "cancelledRegistrationId": result["cancelled_registration_id"],
            "status": result["status"],
            "promotedRegistration": result["promoted_registration"],
        }
    except ValueError as e:
        message = str(e)
        if message == "Registration not found":
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=400, detail=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{registration_id}/kick")
def organizer_kick_registration(registration_id: str, req: OrganizerKickRequest, db=Depends(get_db)):
    registration = db.execute(
        """
        SELECT r.id, r.event_id, e.organizer_id, u.email AS organizer_email
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        LEFT JOIN users u ON u.id = e.organizer_id
        WHERE r.id = %s
        """,
        (registration_id,),
    ).fetchone()

    if not registration:
        raise HTTPException(status_code=404, detail="Registration not found")

    organizer_email = (registration.get("organizer_email") or "").strip().lower()
    requester_email = (req.organizerEmail or "").strip().lower()
    if organizer_email != requester_email:
        raise HTTPException(status_code=403, detail="Only the organizer can remove attendees")

    try:
        result = cancel_registration(db, registration_id=registration_id)
        return {
            "ok": True,
            "cancelledRegistrationId": result["cancelled_registration_id"],
            "status": result["status"],
            "promotedRegistration": result["promoted_registration"],
        }
    except ValueError as e:
        message = str(e)
        if message == "Registration not found":
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=400, detail=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{registration_id}/kick")
def organizer_kick_registration_post(registration_id: str, req: OrganizerKickRequest, db=Depends(get_db)):
    return organizer_kick_registration(registration_id, req, db)


@router.delete("/{registration_id}")
def delete_registration(registration_id: str, db=Depends(get_db)):
    try:
        result = cancel_registration(db, registration_id=registration_id)
        return {
            "ok": True,
            "cancelledRegistrationId": result["cancelled_registration_id"],
            "status": result["status"],
            "promotedRegistration": result["promoted_registration"],
        }
    except ValueError as e:
        message = str(e)
        if message == "Registration not found":
            raise HTTPException(status_code=404, detail=message)
        raise HTTPException(status_code=400, detail=message)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
