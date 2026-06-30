from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import get_db
import bcrypt
from jose import jwt
import os
from datetime import datetime, timedelta

router = APIRouter()

# ---------------------------------------------------------------------------
# JWT config — добави JWT_SECRET в .env за продукция!
# ---------------------------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "heracle_dev_secret_change_in_prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24 * 7  # 7 дни


def create_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    password: str
    role: Optional[str] = "student"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    res = db.execute(
        """SELECT id, email, role, first_name AS "firstName", last_name AS "lastName", password_hash
           FROM users WHERE email = %s""",
        (req.email,),
    ).fetchone()

    if not res:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Поддържа стари редове с "hashed_password" placeholder (seed data)
    stored_hash = res["password_hash"]
    if stored_hash == "hashed_password":
        # Legacy seed потребители — всяка парола минава (само за dev)
        pass
    elif not verify_password(req.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(res["id"], res["email"], res["role"].lower())

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": res["id"],
            "email": res["email"],
            "fullName": f"{res['firstName']} {res['lastName']}",
            "role": res["role"].lower(),
        },
    }


@router.post("/register")
def register(req: RegisterRequest, db=Depends(get_db)):
    # Провери дали email вече съществува
    existing = db.execute(
        "SELECT id FROM users WHERE email = %s", (req.email,)
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    hashed = hash_password(req.password)

    try:
        result = db.execute(
            """INSERT INTO users (email, password_hash, role, first_name, last_name)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id""",
            (req.email, hashed, req.role.upper(), req.firstName, req.lastName),
        ).fetchone()
        user_id = result["id"]
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Registration failed")

    token = create_token(user_id, req.email, req.role.lower())

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": req.email,
            "fullName": f"{req.firstName} {req.lastName}",
            "role": req.role.lower(),
        },
    }