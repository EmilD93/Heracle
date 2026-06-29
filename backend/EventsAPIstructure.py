from enum import Enum
from datetime import datetime

from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from pydantic import Field, model_validator

app = FastAPI()


# =====================
# Event Status
# =====================

class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CANCELLED = "CANCELLED"


# =====================
# Request Model
# =====================

class EventCreate(BaseModel):
    title: str
    description: str
    start_time: datetime
    end_time: datetime
    capacity: int 
    organizer_id: int


# =====================
# Stored Event Model
# =====================

class Event(BaseModel):
    id: int
    title: str =Field(min_length=3,max_length=100)
    description: str = Field(max_length=200)
    start_time: datetime
    end_time: datetime
    capacity: int = Field(gt=0)
    organizer_id: int
    status: EventStatus = EventStatus.DRAFT

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError(
                "end_time must be after start_time"
            )
        return self


# =====================
# Fake Database
# =====================

events = []
next_id = 1


# =====================
# Endpoint 1
# POST /events
#Creates events
# =====================

@app.post("/events")
def create_event(event: EventCreate):
    global next_id
    if event.end_time <= event.start_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time"
            )
    

    new_event = Event(
        id=next_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        capacity=event.capacity,
        organizer_id=event.organizer_id,
        status=EventStatus.DRAFT,
    )

    events.append(new_event)
    next_id += 1

    return new_event


# =====================
# Endpoint 2
# GET /events
#Returns different events based on account type
# =====================
#Check whether organizers have id =========================================================================
@app.get("/events")
def get_events(account_type: str, organizer_id: int = None):

    if account_type == "Student":
        return [
            event
            for event in events
            if event.status == EventStatus.PUBLISHED
        ]

    if account_type == "Organizer" and organizer_id!=None:
        return [
            event
            for event in events
            if event.organizer_id == organizer_id
            and event.status in (
                EventStatus.DRAFT,
                EventStatus.PUBLISHED
            )
        ]
    elif account_type == "Organizer" and organizer_id == None:
        raise HTTPException(
        status_code=400,
        detail="organizer_id is required"
        )
    
    raise HTTPException(
        status_code=400,
        detail="account_type must be Student or Organizer"
    )


    


# =====================
# Endpoint 3
# GET /events/{id}
# =====================

@app.get("/events/{event_id}")
def get_event(event_id: int):

    for event in events:
        if event.id == event_id:
            return event

    raise HTTPException(
    status_code=404,
    detail="Event not found"
    )

# =====================
# Endpoint 4
# PUT /events/{id}
#Change existing events
# =====================

@app.put("/events/{event_id}")
def update_event(event_id: int , updated_event: EventCreate):

    for event in events:

        if event.id == event_id:
            if(event.status ==EventStatus.CANCELLED):
                raise HTTPException(
                status_code=400,
                detail="Cancelled events cannot be modified"
              )
            event.title = updated_event.title
            event.description = updated_event.description
            event.start_time = updated_event.start_time
            event.end_time = updated_event.end_time
            event.capacity = updated_event.capacity

            return event

    raise HTTPException(
    status_code=404,
    detail="Event not found"
    )

# =====================
# Endpoint 5
# POST /events/{id}/publish
# DRAFT -> PUBLISHED
#Makes events published
# =====================

@app.post("/events/{event_id}/publish")
def publish_event(event_id: int, organizer_id:int):

    for event in events:

        if event.id == event_id and event.organizer_id == organizer_id:

            if event.status != EventStatus.DRAFT:
                raise HTTPException(
                status_code=400,
                detail="Only draft events can be published"
                )

            event.status = EventStatus.PUBLISHED

            return {
                "message": "Event published successfully",
                "event": event
            }

    raise HTTPException(
    status_code=404,
    detail="Event not found"
    )


# =====================
# Endpoint 6
# POST /events/{id}/cancel
# PUBLISHED -> CANCELLED
#Cancels events
# =====================

@app.post("/events/{event_id}/cancel")
def cancel_event(event_id: int, organizer_id: int):

    for event in events:

        if event.id == event_id and  event.organizer_id == organizer_id:

            if event.status != EventStatus.PUBLISHED:
                return {
                    "error": "Only published events can be cancelled"
                }

            event.status = EventStatus.CANCELLED

            return {
                "message": "Event cancelled successfully",
                "event": event
            }

    raise HTTPException(
    status_code=404,
    detail="Event not found"
    )