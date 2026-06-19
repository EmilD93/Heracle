# Deliverable 1: User Logic Schemas (Pydantic V2)

### 1. User Roles Enum
```python
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    ORGANIZER = "ORGANIZER"
```

### 2. Pydantic V2 Data Validation Schemas
```python
from datetime import datetime
from uuid import UUID
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

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
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True
```

### 3. Password Hashing Logical Utilities
```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)
```

---

# Deliverable 2: Authentication Flow & Dependency Middleware

### 1. Mermaid.js Flowchart
```mermaid
graph TD
    %% Register Flow
    subgraph Register Flow
        R1[Register Request: UserRegisterRequest] --> R2{Pydantic V2 Validation}
        R2 -- Invalid --> R_Err[422 Unprocessable Entity]
        R2 -- Valid --> R3[Mock DB Unique Email Check]
        R3 -- Email Exists --> R_Exist[400 Bad Request]
        R3 -- Email Unique --> R4[hash_password via bcrypt]
        R4 --> R5[Store mock user with password_hash]
        R5 --> R6[Return UserOut payload]
    end

    %% Login Flow
    subgraph Login Flow
        L1[Login Request: UserLoginRequest] --> L2[Mock query user by email]
        L2 -- Not Found --> L_Err[401 Unauthorized]
        L2 -- Found User --> L3{verify_password plain, hash}
        L3 -- Match Fails --> L_Err
        L3 -- Match Succeeds --> L4[Generate JWT with sub & role claims]
        L4 --> L5[Return TokenResponse]
    end

    %% Secured Request Flow
    subgraph Secured Request Flow
        A1[HTTP Request with Authorization Header] --> A2{Extract Bearer Token}
        A2 -- Missing/Malformed --> A_Err[401 Unauthorized]
        A2 -- Extracted --> A3{Decode & Validate JWT signature/exp}
        A3 -- Signature Expired/Invalid --> A_Err
        A3 -- Valid JWT --> A4[Extract sub: user_id]
        A4 --> A5[Mock get user from database]
        A5 -- User Not Found --> A_Err
        A5 -- User Exists --> A6[Pass UserOut/object to Endpoint Guard]
    end
```

### 2. FastAPI Dependency `get_current_user()`
```python
import os
import uuid
from datetime import datetime
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Dict, Any

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-change-in-production")
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Placeholder DB Lookup Function
def get_user_by_id_placeholder(user_id: uuid.UUID) -> Dict[str, Any]:
    # Placeholder implementation mimicking a database select statement
    return {
        "id": user_id,
        "email": "user@example.com",
        "first_name": "Pavel",
        "last_name": "Ivanov",
        "role": UserRole.ORGANIZER,
        "created_at": datetime.utcnow()
    }

def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        try:
            user_id = uuid.UUID(user_id_str)
        except ValueError:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_id_placeholder(user_id)
    if user is None:
        raise credentials_exception
    return user
```

---

# Deliverable 3: Role Matrix & Authorization Logic Code

### 1. Permission Matrix
| Action | Student | Organizer |
| :--- | :---: | :---: |
| View Events | Yes | Yes |
| Register for Event | Yes | No |
| Cancel Registration | Yes | No |
| Create Event | No | Yes |
| Publish Event | No | Yes |
| Cancel Event | No | Yes |
| View Registrations | No | Yes |

### 2. Role Guards and Ownership Validation
```python
from uuid import UUID
from fastapi import Depends, HTTPException, status
from typing import Dict, Any

# Endpoint guard validating ORGANIZER role
def require_organizer(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != UserRole.ORGANIZER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Organizer role required"
        )
    return current_user

# Endpoint guard validating STUDENT role
def require_student(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    if current_user.get("role") != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Student role required"
        )
    return current_user

# Mock Event representation
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
```

---

# Deliverable 4: API Endpoint Specification & Mock Code

### 1. `POST /register`
#### Endpoint Definition
```python
from fastapi import FastAPI, status, HTTPException
from uuid import uuid4

app = FastAPI()

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
        "created_at": datetime.utcnow()
    }
    return mock_new_user
```
#### Request & Response Samples
* **Request JSON:**
  ```json
  {
    "email": "pavel.ivanov@domain.com",
    "password": "SecurePassword123!",
    "first_name": "Pavel",
    "last_name": "Ivanov",
    "role": "ORGANIZER"
  }
  ```
* **Response JSON (201 Created):**
  ```json
  {
    "id": "e4293f35-4ea5-419b-a010-09b9eb2b512c",
    "email": "pavel.ivanov@domain.com",
    "first_name": "Pavel",
    "last_name": "Ivanov",
    "role": "ORGANIZER",
    "created_at": "2026-06-19T21:40:00Z"
  }
  ```

### 2. `POST /login`
#### Endpoint Definition
```python
from datetime import timedelta

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

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
        
    mock_user_id = uuid.UUID("e4293f35-4ea5-419b-a010-09b9eb2b512c")
    token = create_access_token(data={"sub": str(mock_user_id), "role": UserRole.ORGANIZER})
    return {"access_token": token, "token_type": "bearer"}
```
#### Request & Response Samples
* **Request JSON:**
  ```json
  {
    "email": "pavel.ivanov@domain.com",
    "password": "SecurePassword123!"
  }
  ```
* **Response JSON (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNDI5M2YzNS00ZWE1LTQxOWItYTAxMC0wOWI5ZWIyYjUxMmMiLCJyb2xlIjoiT1JHQU5JWkVSIiwiZXhwIjoxNzg3NDg0ODAwfQ.Signature...",
    "token_type": "bearer"
  }
  ```

### 3. `GET /users/me`
#### Endpoint Definition
```python
@app.get("/users/me", response_model=UserOut)
def get_current_user_profile(current_user: Dict[str, Any] = Depends(get_current_user)):
    return current_user
```
#### Request & Response Samples
* **Headers:**
  ```http
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlNDI5M2YzNS00ZWE1LTQxOWItYTAxMC0wOWI5ZWIyYjUxMmMiLCJyb2xlIjoiT1JHQU5JWkVSIiwiZXhwIjoxNzg3NDg0ODAwfQ.Signature...
  ```
* **Response JSON (200 OK):**
  ```json
  {
    "id": "e4293f35-4ea5-419b-a010-09b9eb2b512c",
    "email": "pavel.ivanov@domain.com",
    "first_name": "Pavel",
    "last_name": "Ivanov",
    "role": "ORGANIZER",
    "created_at": "2026-06-19T21:40:00Z"
  }
  ```
* **Response JSON (401 Unauthorized):**
  ```json
  {
    "detail": "Could not validate credentials"
  }
  ```
