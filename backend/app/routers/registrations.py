from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.database import get_db
from app.services.registration_service import register_student_for_event, cancel_registration

router = APIRouter()

class RegistrationRequest(BaseModel):
    userEmail: str

@router.post("/{event_id}/register")
def register(event_id: str, req: RegistrationRequest, db = Depends(get_db)):
    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (req.userEmail,)).fetchone()
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
                "userEmail": req.userEmail,
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
