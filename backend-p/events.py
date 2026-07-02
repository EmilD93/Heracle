"""
Events router — CRUD + publish/cancel with organizer-only guards.
Mounted at /api/events in main.py to match the frontend's API_BASE + "/events/..." calls.

Route-level protection:
  GET  /              — public (any authenticated user can browse)
  GET  /{event_id}    — public
  POST /              — organizer only
  PATCH /{event_id}   — organizer only
  POST /{event_id}/publish — organizer only
  POST /{event_id}/cancel  — organizer only
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from database import get_db
from auth import require_organizer, get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers (ported from main branch backend/app/routers/events.py)
# ---------------------------------------------------------------------------
def map_event_status(db_status: str) -> str:
    """Convert DB enum → frontend-friendly label."""
    if db_status == "PUBLISHED":
        return "Published"
    if db_status == "CANCELLED":
        return "Cancelled"
    return "Draft"


def map_event_status_to_db(api_status: str) -> str:
    """Convert frontend label → DB enum."""
    if api_status == "Published":
        return "PUBLISHED"
    if api_status == "Cancelled":
        return "CANCELLED"
    return "DRAFT"


def parse_event_date(date_field: Optional[str]):
    """Parse the frontend's combined date string.

    Supports formats such as:
      - "Jun 29, 2026 • 10:00 AM - 12:00 PM"   (12-hour)
      - "Jun 29, 2026 • 14:00 - 16:00"          (24-hour)
      - "2026-06-29"                             (ISO date only)
    """
    fallback_start = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
    fallback_end = fallback_start + timedelta(hours=2)

    if not date_field:
        return fallback_start, fallback_end

    # Split on bullet separator if present
    parts = date_field.split("•")
    date_str = parts[0].strip() if parts else date_field.strip()
    time_str = parts[1].strip() if len(parts) > 1 else ""

    def parse_time(t_str, base_date):
        t_str = t_str.strip()
        for fmt in ("%I:%M %p", "%H:%M"):
            try:
                t = datetime.strptime(t_str, fmt)
                return base_date.replace(
                    hour=t.hour, minute=t.minute, second=0, microsecond=0
                )
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


def serialize_event(row: dict) -> dict:
    """Convert a DB row (with joined organizer columns) into the frontend shape."""
    start_t = row["start_time"].strftime("%b %d, %Y")
    start_h = row["start_time"].strftime("%I:%M %p")

    organizer_name = None
    if row.get("first_name") and row.get("last_name"):
        organizer_name = f"{row['first_name']} {row['last_name']}"

    return {
        "id": str(row["id"]),
        "title": row["title"],
        "description": row["description"],
        "date": f"{start_t} • {start_h}",
        "capacity": row["capacity"],
        "registered": row["registered"],
        "category": row.get("category") or "Academic",
        "status": map_event_status(row["status"]),
        "location": row.get("location") or "Main Campus",
        "image": row.get("image")
        or "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
        "organizer": {
            "name": organizer_name or "Unknown Organizer",
            "email": row.get("org_email") or "",
            "phone": "",
        },
        "agenda": [],
    }


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
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


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    image: Optional[str] = None
    location: Optional[str] = None
    category: Optional[str] = None
    date: Optional[str] = None


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------
@router.get("/")
def get_events(db=Depends(get_db)):
    """List all events (public — any authenticated user can browse)."""
    events = db.execute(
        """
        SELECT e.*,
               u.first_name, u.last_name, u.email AS org_email,
               (SELECT count(*)
                FROM registrations r
                WHERE r.event_id = e.id AND r.status = 'CONFIRMED') AS registered
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        """
    ).fetchall()
    return [serialize_event(row) for row in events]


@router.get("/{event_id}")
def get_event(event_id: str, db=Depends(get_db)):
    """Get a single event by ID (public)."""
    row = db.execute(
        """
        SELECT e.*,
               u.first_name, u.last_name, u.email AS org_email,
               (SELECT count(*)
                FROM registrations r
                WHERE r.event_id = e.id AND r.status = 'CONFIRMED') AS registered
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
        WHERE e.id = %s
        """,
        (event_id,),
    ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return serialize_event(row)


# ---------------------------------------------------------------------------
# Organizer-only routes
# ---------------------------------------------------------------------------
@router.post("/")
def create_event(
    event: EventCreate,
    db=Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_organizer),
):
    """Create a new event.  **Organizer only.**"""
    if not event.title or not event.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    if event.capacity is None or event.capacity < 1:
        raise HTTPException(
            status_code=400, detail="Event capacity must be at least 1"
        )

    try:
        # Use the authenticated organizer's ID instead of looking up by email
        organizer_id = current_user["id"]

        start_dt, end_dt = parse_event_date(event.date)

        res = db.execute(
            """
            INSERT INTO events
                (title, description, capacity, status,
                 start_time, end_time, organizer_id, image, location, category)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (
                event.title,
                event.description,
                event.capacity,
                map_event_status_to_db(event.status),
                start_dt,
                end_dt,
                organizer_id,
                event.image,
                event.location,
                event.category,
            ),
        )
        db.commit()
        return {"id": str(res.fetchone()["id"])}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{event_id}")
def update_event(
    event_id: str,
    updates: EventUpdate,
    db=Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_organizer),
):
    """Update an event.  **Organizer only.**"""
    try:
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
                raise HTTPException(
                    status_code=400,
                    detail="Event capacity must be at least 1",
                )
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
            start_dt, end_dt = parse_event_date(updates.date)
            fields.append("start_time = %s")
            values.append(start_dt)
            fields.append("end_time = %s")
            values.append(end_dt)

        if not fields:
            return {"status": "ok"}

        values.append(event_id)
        query = f"UPDATE events SET {', '.join(fields)} WHERE id = %s RETURNING id"

        res = db.execute(query, tuple(values))
        if not res.fetchone():
            raise HTTPException(status_code=404, detail="Event not found")
        db.commit()
        return {"status": "ok"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


def _set_event_status(event_id: str, new_status: str, db):
    """Shared helper for publish / cancel."""
    try:
        res = db.execute(
            "UPDATE events SET status = %s WHERE id = %s RETURNING id, status",
            (new_status, event_id),
        )
        row = res.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        db.commit()
        return {
            "id": str(row["id"]),
            "status": map_event_status(row["status"]),
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{event_id}/publish")
def publish_event(
    event_id: str,
    db=Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_organizer),
):
    """Publish a DRAFT event.  **Organizer only.**"""
    return _set_event_status(event_id, "PUBLISHED", db)


@router.post("/{event_id}/cancel")
def cancel_event(
    event_id: str,
    db=Depends(get_db),
    current_user: Dict[str, Any] = Depends(require_organizer),
):
    """Cancel an event.  **Organizer only.**"""
    return _set_event_status(event_id, "CANCELLED", db)
