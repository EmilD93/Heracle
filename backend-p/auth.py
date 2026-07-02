"""
Authentication router — registration, login, /users/me, JWT validation, role guards.
Mounted at /api/auth in main.py to match the frontend's API_BASE + "/auth/..." calls.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import jwt, JWTError
import psycopg

from database import get_db

router = APIRouter()

# ---------------------------------------------------------------------------
# JWT configuration
# ---------------------------------------------------------------------------
SECRET_KEY = os.getenv(
    "JWT_SECRET", "supersecretkey_change_me_in_production_1234567890"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days — matches main branch


def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


# ---------------------------------------------------------------------------
# Password utilities (direct bcrypt — no passlib dependency needed)
# ---------------------------------------------------------------------------
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash.
    Also handles legacy seed data where password_hash == 'hashed_password'."""
    if hashed_password == "hashed_password":
        # Legacy dev bypass — only for seed rows that were never re-hashed
        return True
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


# ---------------------------------------------------------------------------
# OAuth2 scheme — points at the login endpoint used by Swagger "Authorize"
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------
class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------------------------------------------------------------------------
# JWT validation dependency — extracts the current user from the bearer token
# ---------------------------------------------------------------------------
def get_current_user(
    token: str = Depends(oauth2_scheme), db=Depends(get_db)
) -> Dict[str, Any]:
    """Decode the JWT, look up the user in the DB and return the row dict.

    The token ``sub`` claim is the user's **email** (matching this branch's
    ``create_access_token`` call).  The ``role`` claim is also present but
    the authoritative source is the DB row.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.execute(
        "SELECT id, email, role, first_name, last_name FROM users WHERE email = %s",
        (email,),
    ).fetchone()
    if user is None:
        raise credentials_exception
    return user


# ---------------------------------------------------------------------------
# Role guard helpers
# ---------------------------------------------------------------------------
def require_organizer(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Dependency that only allows users with the ORGANIZER role through."""
    if current_user.get("role", "").upper() != "ORGANIZER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Organizer role required",
        )
    return current_user


def require_student(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """Dependency that only allows users with the STUDENT role through."""
    if current_user.get("role", "").upper() != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Student role required",
        )
    return current_user


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/register")
def register(req: RegisterRequest, db=Depends(get_db)):
    """Register a new user.  Returns an access_token so the frontend can
    log the user in immediately after registration (matches main branch)."""
    role_upper = req.role.upper()
    if role_upper not in ("STUDENT", "ORGANIZER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either student or organizer",
        )

    # Check if email already exists
    existing = db.execute(
        "SELECT id FROM users WHERE email = %s", (req.email,)
    ).fetchone()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )

    hashed_pwd = get_password_hash(req.password)
    try:
        res = db.execute(
            """INSERT INTO users (email, password_hash, role, first_name, last_name)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, email, role, first_name, last_name""",
            (req.email, hashed_pwd, role_upper, req.firstName, req.lastName),
        )
        user = res.fetchone()
        db.commit()

        # Generate token so the frontend can log in right away
        token = create_access_token(
            data={"sub": user["email"], "role": user["role"].lower()}
        )

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "fullName": f"{user['first_name']} {user['last_name']}",
                "role": user["role"].lower(),
            },
        }
    except psycopg.errors.UniqueViolation:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login")
def login(req: LoginRequest, db=Depends(get_db)):
    """Authenticate with email + password.  Returns access_token + user object
    in the same shape the frontend (authStore.ts) expects."""
    user = db.execute(
        """SELECT id, email, password_hash, role, first_name, last_name
           FROM users WHERE email = %s""",
        (req.email,),
    ).fetchone()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(
        data={"sub": user["email"], "role": user["role"].lower()}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
            "fullName": f"{user['first_name']} {user['last_name']}",
            "role": user["role"].lower(),
        },
    }


@router.get("/users/me")
def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Return the currently authenticated user's profile.
    Protected — requires a valid bearer token."""
    return {
        "id": str(current_user["id"]),
        "email": current_user["email"],
        "fullName": f"{current_user['first_name']} {current_user['last_name']}",
        "role": current_user["role"].lower(),
    }
