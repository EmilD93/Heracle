from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
from app.services.notification_service import create_notification_job

router = APIRouter()

class RegistrationRequest(BaseModel):
    userEmail: str

@router.post("/{event_id}/register")
def register(event_id: str, req: RegistrationRequest, db = Depends(get_db)):
    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (req.userEmail,)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
        user_id = user['id']

        event = db.execute("SELECT id, capacity FROM events WHERE id = %s", (event_id,)).fetchone()
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")

        # Check existing registration
        existing = db.execute(
            "SELECT id, status FROM registrations WHERE student_id = %s AND event_id = %s AND status != 'CANCELLED'",
            (user_id, event_id)
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Already registered")

        # Count confirmed
        confirmed = db.execute(
            "SELECT COUNT(*) as count FROM registrations WHERE event_id = %s AND status = 'CONFIRMED'",
            (event_id,)
        ).fetchone()

        is_full = confirmed['count'] >= event['capacity']
        status = 'WAITLISTED' if is_full else 'CONFIRMED'

        # Get max position
        max_pos = db.execute(
            "SELECT MAX(position) as m FROM registrations WHERE event_id = %s",
            (event_id,)
        ).fetchone()
        position = (max_pos['m'] or 0) + 1

        reg = db.execute("""
            INSERT INTO registrations (student_id, event_id, status, position)
            VALUES (%s, %s, %s, %s)
            RETURNING id, status, position, created_at
        """, (user_id, event_id, status, position)).fetchone()

        notification_type = (
            "RegistrationWaitlisted"
            if status == "WAITLISTED"
            else "RegistrationConfirmed"
        )

        notification_message = (
            "You have been added to the waitlist."
            if status == "WAITLISTED"
            else "Your registration has been confirmed."
        )

        notification_job_id = create_notification_job(
            db=db,
            notification_type=notification_type,
            user_id=str(user_id),
            event_id=str(event_id),
            registration_id=str(reg["id"]),
            payload={
                "message": notification_message,
                "registration_id": str(reg["id"]),
                "event_id": str(event_id),
                "student_id": str(user_id),
                "status": status,
            },
        )

        db.commit()

        return {
            "ok": True,
            "registration": {
                "id": str(reg["id"]),
                "userEmail": req.userEmail,
                "eventId": event_id,
                "status": reg["status"],
                "position": reg["position"],
                "createdAt": str(reg["created_at"]),
            },
            "notificationJobId": str(notification_job_id),
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
