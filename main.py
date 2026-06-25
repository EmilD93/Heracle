import os
import uuid
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, ConfigDict, EmailStr, Field

# Initialize the FastAPI app instance
app = FastAPI()

# --- TASK 1 & 2: CONTEXT SCHEMAS AND DATA LAYER ---

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ORGANIZER = "ORGANIZER"

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Plain text password, minimum 8 characters")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: UserRole

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    created_at: datetime

# --- PASSWORD UTILITIES ---

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# --- JWT AUTHENTICATION MIDDLEWARE ---

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Placeholder DB Lookup Function
def get_user_by_id_placeholder(user_id: UUID) -> Dict[str, Any]:
    # Placeholder implementation mimicking a database select statement
    return {
        "id": user_id,
        "email": "pavel.ivanov@domain.com",
        "first_name": "Pavel",
        "last_name": "Ivanov",
        "role": UserRole.ORGANIZER,
        "created_at": datetime.now(timezone.utc)
    }

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        role_str = payload.get("role")
        if user_id_str is None or not isinstance(user_id_str, str):
            raise credentials_exception
        try:
            user_id = UUID(user_id_str)
        except ValueError:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id_placeholder(user_id)
    if user is None:
        raise credentials_exception
    
    # Explicitly ensure role is synced with token's claim if it differs dynamically
    if role_str and isinstance(role_str, str):
        user["role"] = UserRole(role_str)
        
    return user

# --- ROLE GUARDS ---

def require_organizer(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Organizer role required"
        )
    return current_user

def require_student(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Student role required"
        )
    return current_user

# --- TASK 1: USER MODEL AND AUTHENTICATION ENDPOINTS ---

@app.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register_user(request: UserRegisterRequest):
    # Mock uniqueness check
    if request.email == "taken@example.com":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_pwd = hash_password(request.password)
    # Placeholder persistence object
    mock_new_user = {
        "id": uuid4(),
        "email": request.email,
        "first_name": request.first_name,
        "last_name": request.last_name,
        "role": request.role,
        "created_at": datetime.now(timezone.utc)
    }
    return mock_new_user

@app.post("/login", response_model=TokenResponse)
def login_user(request: UserLoginRequest):
    # Mock User lookup and password check
    if request.email != "pavel.ivanov@domain.com":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    mock_hash = hash_password("SecurePassword123!")
    if not verify_password(request.password, mock_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    mock_user_id = UUID("e4293f35-4ea5-419b-a010-09b9eb2b512c")
    token = create_access_token(data={"sub": str(mock_user_id), "role": UserRole.ORGANIZER})
    return {"access_token": token, "token_type": "bearer"}

# --- TASK 2: JWT MIDDLEWARE AND ROLE AUTHORIZATION ---

@app.get("/users/me", response_model=UserOut)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user

# Mock Event representation for resource owner validation
class MockEvent:
    def __init__(self, id: UUID, title: str, organizer_id: UUID):
        self.id = id
        self.title = title
        self.organizer_id = organizer_id

# Resource Owner Validation Logic Dependency
def verify_event_owner(
    event_id: UUID,
    current_user: Dict[str, Any] = Depends(require_organizer)
) -> MockEvent:
    # Placeholder: represent retrieving an event from the DB
    mock_event_organizer_id = UUID("11111111-2222-3333-4444-555555555555")
    event = MockEvent(id=event_id, title="Sample Event", organizer_id=mock_event_organizer_id)
    
    # Ownership Control Statement
    if event.organizer_id != current_user.get("id"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: You do not own this event"
        )
    return event
