from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime, timedelta
from app.database import get_db
from app.services.notification_service import create_notification_job

router = APIRouter()


def ensure_user_profile_columns(db):
    db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT")


def map_event_status(db_status: str) -> str:
    if db_status == "PUBLISHED":
        return "Published"
    if db_status == "CANCELLED":
        return "Cancelled"
    return "Draft"


def map_event_status_to_db(api_status: str) -> str:
    if api_status == "Published":
        return "PUBLISHED"
    if api_status == "Cancelled":
        return "CANCELLED"
    return "DRAFT"


def queue_event_notifications_for_joined_students(
    db,
    *,
    event_id: str,
    notification_type: str,
    message: str,
):
    recipients = db.execute(
        """
        SELECT r.id AS registration_id, r.student_id
        FROM registrations r
        WHERE r.event_id = %s
          AND r.status IN ('CONFIRMED', 'WAITLISTED')
        """,
        (event_id,),
    ).fetchall()

    for recipient in recipients:
        create_notification_job(
            db,
            notification_type=notification_type,
            user_id=str(recipient["student_id"]),
            event_id=event_id,
            registration_id=str(recipient["registration_id"]),
            payload={
                "event_id": event_id,
                "message": message,
            },
        )

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    image: str
    capacity: int
    category: str
    status: str
    location: str
    organizer: dict
    agenda: List[dict]
    createdBy: str


def parse_event_date(date_field: Optional[str]):
    """Parse the frontend's combined date string, e.g.
    "Jun 29, 2026 bullet 10:00 AM - 12:00 PM" (12h, from GET/edit round-trip) or
    "Jun 29, 2026 bullet 14:00 - 16:00" (24h, from the Create form's <input type=time>).

    Returns (start_dt, end_dt). Falls back to "tomorrow, 10am-12pm" only if the
    field is missing or truly unparseable, so a bad date never silently
    overrides what the organizer actually submitted.
    """
    fallback_start = datetime.now() + timedelta(days=1)
    fallback_end = fallback_start + timedelta(hours=2)

    if not date_field or not date_field.strip():
        return fallback_start, fallback_end

    parts = [p.strip() for p in date_field.split("\u2022")]
    date_str = parts[0]
    time_str = parts[1] if len(parts) > 1 else ""

    def parse_time(t: str, on_date: datetime):
        t = t.strip()
        if not t:
            return None
        for fmt in ("%I:%M %p", "%H:%M"):
            try:
                parsed = datetime.strptime(t, fmt)
                return on_date.replace(hour=parsed.hour, minute=parsed.minute, second=0, microsecond=0)
            except ValueError:
                continue
        return None

    parsed_date = None
    for fmt in ("%b %d, %Y", "%Y-%m-%d"):
        try:
            parsed_date = datetime.strptime(date_str, fmt)
            break
        except ValueError:
            continue

    if parsed_date is None:
        return fallback_start, fallback_end

    time_parts = time_str.replace("\u2013", "-").split("-") if time_str else []
    start_dt = parse_time(time_parts[0], parsed_date) if len(time_parts) > 0 else None
    end_dt = parse_time(time_parts[1], parsed_date) if len(time_parts) > 1 else None

    if start_dt is None:
        start_dt = parsed_date.replace(hour=10, minute=0)
    if end_dt is None or end_dt <= start_dt:
        end_dt = start_dt + timedelta(hours=2)

    return start_dt, end_dt


def serialize_event(row):
    start_t = row['start_time'].strftime("%b %d, %Y")
    start_h = row['start_time'].strftime("%I:%M %p")

    organizer_name = None
    if row.get('first_name') and row.get('last_name'):
        organizer_name = f"{row['first_name']} {row['last_name']}"

    return {
        "id": str(row['id']),
        "title": row['title'],
        "description": row['description'],
        "date": f"{start_t} • {start_h}",
        "capacity": row['capacity'],
        "registered": row['registered'],
        "category": row.get('category') or "Academic",
        "status": map_event_status(row['status']),
        "location": row.get('location') or "Main Campus",
        "image": row.get('image') or "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        "organizer": {
            "name": organizer_name or "Unknown Organizer",
            "email": row.get('org_email') or "",
            "phone": "",
            "profilePhotoUrl": row.get('org_profile_photo_url') or "",
        },
        "agenda": []
    }

@router.get("/")
def get_events(db = Depends(get_db)):
    ensure_user_profile_columns(db)
    events = db.execute("""
        SELECT e.*, 
               u.first_name, u.last_name, u.email as org_email, u.profile_photo_url as org_profile_photo_url,
               (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status='CONFIRMED') as registered
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
    """).fetchall()

    return [serialize_event(row) for row in events]


@router.get("/{event_id}")
def get_event(event_id: str, db=Depends(get_db)):
    ensure_user_profile_columns(db)
    row = db.execute(
        """
        SELECT e.*,
               u.first_name, u.last_name, u.email AS org_email, u.profile_photo_url AS org_profile_photo_url,
               (
                   SELECT count(*)
                   FROM registrations r
                   WHERE r.event_id = e.id AND r.status = 'CONFIRMED'
               ) AS registered
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.id = %s
        """,
        (event_id,),
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")

    return serialize_event(row)

@router.post("/")
def create_event(event: EventCreate, db = Depends(get_db)):
    # Basic validation with messages the frontend can surface directly
    if not event.title or not event.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    if event.capacity is None or event.capacity < 1:
        raise HTTPException(status_code=400, detail="Event capacity must be at least 1")

    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (event.createdBy,)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")

        start_dt, end_dt = parse_event_date(event.date)

        res = db.execute("""
            INSERT INTO events (title, description, capacity, status, start_time, end_time, organizer_id, image, location, category)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            event.title, 
            event.description, 
            event.capacity, 
            map_event_status_to_db(event.status),
            start_dt,
            end_dt,
            user['id'],
            event.image,
            event.location,
            event.category
        ))
        db.commit()
        return {"id": str(res.fetchone()['id'])}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    image: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None

@router.patch("/{event_id}")
def update_event(event_id: str, updates: EventUpdate, db = Depends(get_db)):
    try:
        # Build dynamic query based on provided fields
        fields = []
        values = []
        if updates.title is not None:
            fields.append("title = %s")
            values.append(updates.title)
        if updates.description is not None:
            fields.append("description = %s")
            values.append(updates.description)
        if updates.capacity is not None:
            if updates.capacity < 1:
                raise HTTPException(status_code=400, detail="Event capacity must be at least 1")
            fields.append("capacity = %s")
            values.append(updates.capacity)
        if updates.status is not None:
            fields.append("status = %s")
            values.append(map_event_status_to_db(updates.status))
        if updates.image is not None:
            fields.append("image = %s")
            values.append(updates.image)
        if updates.location is not None:
            fields.append("location = %s")
            values.append(updates.location)
        if updates.category is not None:
            fields.append("category = %s")
            values.append(updates.category)
        if updates.date is not None:
            # Handles both "Jun 29, 2026 • 10:00 AM - 12:00 PM" (12h) and
            # "Jun 29, 2026 • 14:00 - 16:00" (24h, from the Create/Edit form).
            start_dt, end_dt = parse_event_date(updates.date)
            fields.append("start_time = %s")
            values.append(start_dt)
            fields.append("end_time = %s")
            values.append(end_dt)


        if not fields:
            return {"status": "ok"}
            
        values.append(event_id)
        query = f"UPDATE events SET {', '.join(fields)} WHERE id = %s RETURNING id, title, status"

        res = db.execute(query, tuple(values))
        row = res.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        event_title = row.get("title") or "Event"
        if row.get("status") == "CANCELLED":
            queue_event_notifications_for_joined_students(
                db,
                event_id=event_id,
                notification_type="EventCancelled",
                message=f"{event_title} was cancelled by the organizer.",
            )
        else:
            queue_event_notifications_for_joined_students(
                db,
                event_id=event_id,
                notification_type="EventUpdated",
                message=f"{event_title} was updated. Please review the latest details.",
            )

        db.commit()
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def _set_event_status(event_id: str, new_status: str, db):
    """Shared implementation for the publish/cancel endpoints below."""
    try:
        res = db.execute(
            "UPDATE events SET status = %s WHERE id = %s RETURNING id, status, title",
            (new_status, event_id),
        )
        row = res.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")

        event_title = row.get("title") or "Event"
        if new_status == "CANCELLED":
            queue_event_notifications_for_joined_students(
                db,
                event_id=event_id,
                notification_type="EventCancelled",
                message=f"{event_title} was cancelled by the organizer.",
            )
        else:
            queue_event_notifications_for_joined_students(
                db,
                event_id=event_id,
                notification_type="EventUpdated",
                message=f"{event_title} was updated. Please review the latest details.",
            )

        db.commit()
        return {"id": str(row["id"]), "status": "Published" if row["status"] == "PUBLISHED" else ("Cancelled" if row["status"] == "CANCELLED" else "Draft")}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/publish")
def publish_event(event_id: str, db = Depends(get_db)):
    """Marks a DRAFT event as PUBLISHED so students can see and register for it."""
    return _set_event_status(event_id, "PUBLISHED", db)


@router.post("/{event_id}/cancel")
def cancel_event(event_id: str, db = Depends(get_db)):
    """Marks an event as CANCELLED so it stops accepting new registrations."""
    return _set_event_status(event_id, "CANCELLED", db)

