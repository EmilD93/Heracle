from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from app.database import get_db

router = APIRouter()

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

@router.get("/")
def get_events(db = Depends(get_db)):
    events = db.execute("""
        SELECT e.*, 
               u.first_name, u.last_name, u.email as org_email,
               (SELECT count(*) FROM registrations r WHERE r.event_id = e.id AND r.status='CONFIRMED') as registered
        FROM events e
        LEFT JOIN users u ON e.organizer_id = u.id
    """).fetchall()

    # Map database row format to frontend format
    result = []
    for row in events:
        start_t = row['start_time'].strftime("%b %d, %Y")
        start_h = row['start_time'].strftime("%I:%M %p")
        
        result.append({
            "id": str(row['id']),
            "title": row['title'],
            "description": row['description'],
            "date": f"{start_t} • {start_h}",
            "capacity": row['capacity'],
            "registered": row['registered'],
            "category": row.get('category') or "Academic",
            "status": "Published" if row['status'] == 'PUBLISHED' else "Draft",
            "location": row.get('location') or "Main Campus",
            "image": row.get('image') or "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
            "organizer": {
                "name": f"{row['first_name']} {row['last_name']}",
                "email": row['org_email'],
                "phone": ""
            },
            "agenda": []
        })
    return result

@router.post("/")
def create_event(event: EventCreate, db = Depends(get_db)):
    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (event.createdBy,)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
            
        res = db.execute("""
            INSERT INTO events (title, description, capacity, status, start_time, end_time, organizer_id, image, location, category)
            VALUES (%s, %s, %s, %s, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', %s, %s, %s, %s)
            RETURNING id
        """, (
            event.title, 
            event.description, 
            event.capacity, 
            "PUBLISHED" if event.status == "Published" else "DRAFT",
            user['id'],
            event.image,
            event.location,
            event.category
        ))
        return {"id": str(res.fetchone()['id'])}
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
            fields.append("capacity = %s")
            values.append(updates.capacity)
        if updates.status is not None:
            fields.append("status = %s")
            values.append("PUBLISHED" if updates.status == "Published" else ("CANCELLED" if updates.status == "Cancelled" else "DRAFT"))
        if updates.image is not None:
            fields.append("image = %s")
            values.append(updates.image)
        if updates.location is not None:
            fields.append("location = %s")
            values.append(updates.location)
        if updates.category is not None:
            fields.append("category = %s")
            values.append(updates.category)

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

