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


class ProfileUpdateRequest(BaseModel):
    fullName: Optional[str] = None
    profilePhotoUrl: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None


def ensure_user_profile_columns(db):
    db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT")
    db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT")
    db.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)")


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    ensure_user_profile_columns(db)
    res = db.execute(
        """SELECT id, email, role, first_name AS "firstName", last_name AS "lastName", profile_photo_url AS "profilePhotoUrl", password_hash
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
            "profilePhotoUrl": res.get("profilePhotoUrl") or "",
        },
    }


@router.post("/register")
def register(req: RegisterRequest, db=Depends(get_db)):
    ensure_user_profile_columns(db)
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
            "profilePhotoUrl": "",
        },
    }

class GoogleLoginRequest(BaseModel):
    token: str

@router.post("/google")
def google_login(req: GoogleLoginRequest, db=Depends(get_db)):
    try:
        ensure_user_profile_columns(db)
        import requests
        # We can use google-auth id_token if it's a JWT ID token, or an API call if it's an access token
        # @react-oauth/google useGoogleLogin usually returns an access_token. Let's fetch profile using access_token
        res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {req.token}"}
        )
        
        if not res.ok:
            raise HTTPException(status_code=401, detail="Invalid Google token")
            
        user_info = res.json()
        email = user_info.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
            
        first_name = user_info.get("given_name", "Google")
        last_name = user_info.get("family_name", "User")
        
        # Check if user exists
        existing = db.execute(
            """SELECT id, email, role, first_name AS "firstName", last_name AS "lastName", profile_photo_url AS "profilePhotoUrl"
               FROM users WHERE email = %s""",
            (email,)
        ).fetchone()
        
        if existing:
            user_id = existing["id"]
            role = existing["role"]
            full_name = f"{existing['firstName']} {existing['lastName']}"
            profile_photo_url = existing.get("profilePhotoUrl") or ""
        else:
            # Auto-register Google users as STUDENT
            import uuid
            import string
            import random
            
            # generate random password for google users
            random_pw = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
            hashed = hash_password(random_pw)
            role = "STUDENT"
            
            new_user = db.execute(
                """INSERT INTO users (email, password_hash, role, first_name, last_name)
                   VALUES (%s, %s, %s, %s, %s)
                   RETURNING id""",
                (email, hashed, role, first_name, last_name)
            ).fetchone()
            user_id = new_user["id"]
            full_name = f"{first_name} {last_name}"
            profile_photo_url = ""
            db.commit()
            
        token = create_token(user_id, email, role.lower())
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user_id,
                "email": email,
                "fullName": full_name,
                "role": role.lower(),
                "profilePhotoUrl": profile_photo_url,
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/profile/{email}")
def get_profile(email: str, db=Depends(get_db)):
    ensure_user_profile_columns(db)
    user = db.execute(
        """
        SELECT id, email, role, first_name, last_name, profile_photo_url, bio, phone
        FROM users
        WHERE email = %s
        """,
        (email,),
    ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    full_name = f"{user['first_name']} {user['last_name']}".strip()
    return {
        "ok": True,
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
            "role": user["role"].lower(),
            "fullName": full_name,
            "profilePhotoUrl": user.get("profile_photo_url") or "",
            "bio": user.get("bio") or "",
            "phone": user.get("phone") or "",
        },
    }


@router.patch("/profile/{email}")
def update_profile(email: str, req: ProfileUpdateRequest, db=Depends(get_db)):
    ensure_user_profile_columns(db)
    user = db.execute("SELECT id FROM users WHERE email = %s", (email,)).fetchone()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    fields = []
    values = []

    if req.fullName is not None:
        parts = req.fullName.strip().split()
        if len(parts) == 0:
            raise HTTPException(status_code=400, detail="Full name cannot be empty")
        first_name = parts[0]
        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
        fields.append("first_name = %s")
        values.append(first_name)
        fields.append("last_name = %s")
        values.append(last_name)

    if req.profilePhotoUrl is not None:
        fields.append("profile_photo_url = %s")
        values.append(req.profilePhotoUrl)

    if req.bio is not None:
        fields.append("bio = %s")
        values.append(req.bio)

    if req.phone is not None:
        fields.append("phone = %s")
        values.append(req.phone)

    if fields:
        values.append(email)
        db.execute(f"UPDATE users SET {', '.join(fields)} WHERE email = %s", tuple(values))
        db.commit()

    return get_profile(email, db)