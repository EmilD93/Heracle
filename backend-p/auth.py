import os
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
import bcrypt
from jose import jwt, JWTError
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from dotenv import load_dotenv

# Load database configuration from environment
dotenv_paths = [
    os.path.join(os.path.dirname(__file__), "../backend/.env"),
    os.path.join(os.path.dirname(__file__), "backend/.env"),
    "/home/pavkatapenev/Documents/Antigravity_work/backend/.env"
]
for path in dotenv_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break
else:
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set")

# Setup PostgreSQL connection pool
pool = ConnectionPool(
    conninfo=DATABASE_URL,
    kwargs={"row_factory": dict_row},
    min_size=1,
    max_size=10
)

# Password hashing setup using bcrypt directly
def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkey_change_me_in_production_1234567890")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# FastAPI Application
app = FastAPI(title="Heracle Authentication API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemes
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Pydantic schemas
class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: EmailStr
    password: str
    role: Optional[str] = "student"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# Helper to get DB connection
def get_db():
    with pool.connection() as conn:
        yield conn

# Current user dependency
def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
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
        (email,)
    ).fetchone()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db = Depends(get_db)):
    # Clean and validate role
    role_upper = req.role.upper()
    if role_upper not in ("STUDENT", "ORGANIZER"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be either student or organizer"
        )
        
    hashed_pwd = get_password_hash(req.password)
    try:
        res = db.execute(
            """INSERT INTO users (email, password_hash, role, first_name, last_name) 
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, email, role, first_name, last_name""",
            (req.email, hashed_pwd, role_upper, req.firstName, req.lastName)
        )
        user = res.fetchone()
        db.commit()
        return {
            "ok": True,
            "user": {
                "id": str(user["id"]),
                "email": user["email"],
                "fullName": f"{user['first_name']} {user['last_name']}",
                "role": user["role"].lower()
            }
        }
    except psycopg.errors.UniqueViolation:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/login")
def login(req: LoginRequest, db = Depends(get_db)):
    user = db.execute(
        "SELECT id, email, password_hash, role, first_name, last_name FROM users WHERE email = %s",
        (req.email,)
    ).fetchone()

    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Create access token with user details
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user["id"]),
            "email": user["email"],
            "fullName": f"{user['first_name']} {user['last_name']}",
            "role": user["role"].lower()
        }
    }

@app.get("/users/me")
def get_me(current_user = Depends(get_current_user)):
    return {
        "id": str(current_user["id"]),
        "email": current_user["email"],
        "fullName": f"{current_user['first_name']} {current_user['last_name']}",
        "role": current_user["role"].lower()
    }
