from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, events, registrations

app = FastAPI(title="Heracle API")

# Allow CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in prod, limit to localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(events.router, prefix="/api/events", tags=["events"])
app.include_router(registrations.router, prefix="/api/registrations", tags=["registrations"])

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
