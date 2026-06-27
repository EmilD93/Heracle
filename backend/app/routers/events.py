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
            "category": "Academic", # using fixed category until added to DB schema
            "status": "Published" if row['status'] == 'PUBLISHED' else "Draft",
            "location": "Main Campus", # using fixed location until added to DB schema
            "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000",
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
    # Quick fix for string to date mapping
    # Assuming start_time and end_time are required by DB, we mock end_time
    import datetime
    try:
        user = db.execute("SELECT id FROM users WHERE email = %s", (event.createdBy,)).fetchone()
        if not user:
            raise HTTPException(status_code=400, detail="User not found")
            
        res = db.execute("""
            INSERT INTO events (title, description, capacity, status, start_time, end_time, organizer_id)
            VALUES (%s, %s, %s, %s, NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', %s)
            RETURNING id
        """, (
            event.title, 
            event.description, 
            event.capacity, 
            "PUBLISHED" if event.status == "Published" else "DRAFT",
            user['id']
        ))
        return {"id": str(res.fetchone()['id'])}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
