from __future__ import annotations

from typing import Any, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from backend.app.models.notification_job import NotificationJob
from backend.app.repositories.notification_job_repository import NotificationJobRepository


def create_notification_job(
    db: Session,
    notification_type: str,
    user_id: UUID | str,
    event_id: UUID | str,
    registration_id: Optional[UUID | str] = None,
    payload: Optional[dict[str, Any]] = None,
) -> NotificationJob:
    """
    Creates a pending notification job.

    This function should be called after important registration actions,
    for example:
    - RegistrationConfirmed
    - RegistrationWaitlisted
    - WaitlistPromoted
    - EventCancelled

    No worker logic is handled here.
    This only creates the database record.
    """

    repository = NotificationJobRepository(db)

    return repository.create(
        notification_type=notification_type,
        user_id=user_id,
        event_id=event_id,
        registration_id=registration_id,
        payload=payload or {},
    )