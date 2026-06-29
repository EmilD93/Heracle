from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_db

router = APIRouter()

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    role: Optional[str] = "student"

@router.post("/login")
def login(req: LoginRequest, db = Depends(get_db)):
    res = db.execute(
        "SELECT id, email, role, first_name as \"firstName\", last_name as \"lastName\" FROM users WHERE email = %s",
        (req.email,)
    ).fetchone()

    # Note: Using mock auth for development matching frontend mockup logic
    # In production, verify req.password against res['password_hash']
    if not res:
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    return {
        "user": {
            "email": res["email"],
            "fullName": f"{res['firstName']} {res['lastName']}",
            "role": res["role"].lower()
        }
    }

@router.post("/register")
def register(req: RegisterRequest, db = Depends(get_db)):
    try:
        db.execute(
            """INSERT INTO users (email, password_hash, role, first_name, last_name) 
               VALUES (%s, %s, %s, %s, %s)""",
            (req.email, "hashed_password", req.role.upper(), req.firstName, req.lastName)
        )
        return {
            "user": {
                "email": req.email,
                "fullName": f"{req.firstName} {req.lastName}",
                "role": req.role.lower()
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Email already exists")
