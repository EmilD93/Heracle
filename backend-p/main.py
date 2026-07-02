"""
Heracle Backend — Pavel's branch entry point.

Mirrors the main branch structure:
  /api/auth/*   → auth router (login, register, users/me)
  /api/events/* → events router (CRUD + publish/cancel)
  /api/health   → health check

Run with:
  cd backend-p && python -m uvicorn main:app --reload --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth import router as auth_router
from events import router as events_router

app = FastAPI(title="Heracle API")

# CORS — allow local dev frontend (Vite on :5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # in prod, limit to localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers with the same prefixes as the main branch
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(events_router, prefix="/api/events", tags=["events"])


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
