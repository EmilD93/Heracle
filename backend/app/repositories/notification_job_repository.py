from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.app.models.notification_job import NotificationJob


class NotificationJobRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        *,
        notification_type: str,
        user_id: uuid.UUID | str,
        event_id: uuid.UUID | str,
        payload: Optional[dict[str, Any]] = None,
        registration_id: uuid.UUID | str | None = None,
        scheduled_for: Optional[datetime] = None,
        max_attempts: int = 3,
    ) -> NotificationJob:
        job_data = {
            "type": notification_type,
            "user_id": self._to_uuid(user_id),
            "event_id": self._to_uuid(event_id),
            "registration_id": self._to_uuid(registration_id) if registration_id else None,
            "payload": payload or {},
            "max_attempts": max_attempts,
        }

        if scheduled_for is not None:
            job_data["scheduled_for"] = scheduled_for

        job = NotificationJob(**job_data)

        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)

        return job

    def get_by_id(self, job_id: uuid.UUID | str) -> Optional[NotificationJob]:
        statement = select(NotificationJob).where(
            NotificationJob.id == self._to_uuid(job_id)
        )

        return self.db.execute(statement).scalar_one_or_none()

    def list_all(
        self,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[NotificationJob]:
        statement = (
            select(NotificationJob)
            .order_by(NotificationJob.created_at.desc())
            .limit(limit)
            .offset(offset)
        )

        return list(self.db.execute(statement).scalars().all())

    def list_by_status(
        self,
        status: str,
        *,
        limit: int = 100,
        offset: int = 0,
    ) -> list[NotificationJob]:
        statement = (
            select(NotificationJob)
            .where(NotificationJob.status == status)
            .order_by(NotificationJob.created_at.asc())
            .limit(limit)
            .offset(offset)
        )

        return list(self.db.execute(statement).scalars().all())

    def update(
        self,
        job_id: uuid.UUID | str,
        **fields: Any,
    ) -> Optional[NotificationJob]:
        job = self.get_by_id(job_id)

        if job is None:
            return None

        allowed_fields = {
            "type",
            "payload",
            "status",
            "attempt_count",
            "max_attempts",
            "scheduled_for",
            "locked_at",
            "completed_at",
            "failed_at",
            "error_message",
        }

        for field_name, field_value in fields.items():
            if field_name in allowed_fields:
                setattr(job, field_name, field_value)

        self.db.commit()
        self.db.refresh(job)

        return job

    def update_status(
        self,
        job_id: uuid.UUID | str,
        status: str,
    ) -> Optional[NotificationJob]:
        return self.update(job_id, status=status)

    def mark_pending(
        self,
        job_id: uuid.UUID | str,
    ) -> Optional[NotificationJob]:
        return self.update(
            job_id,
            status="pending",
            locked_at=None,
            completed_at=None,
            failed_at=None,
        )

    def mark_processing(
        self,
        job_id: uuid.UUID | str,
        *,
        locked_at: datetime,
    ) -> Optional[NotificationJob]:
        return self.update(
            job_id,
            status="processing",
            locked_at=locked_at,
        )

    def mark_completed(
        self,
        job_id: uuid.UUID | str,
        *,
        completed_at: datetime,
    ) -> Optional[NotificationJob]:
        return self.update(
            job_id,
            status="completed",
            completed_at=completed_at,
            error_message=None,
        )

    def mark_failed(
        self,
        job_id: uuid.UUID | str,
        *,
        failed_at: datetime,
        error_message: str,
    ) -> Optional[NotificationJob]:
        return self.update(
            job_id,
            status="failed",
            failed_at=failed_at,
            error_message=error_message,
        )

    def increment_attempt_count(
        self,
        job_id: uuid.UUID | str,
    ) -> Optional[NotificationJob]:
        job = self.get_by_id(job_id)

        if job is None:
            return None

        job.attempt_count += 1

        self.db.commit()
        self.db.refresh(job)

        return job

    def delete(
        self,
        job_id: uuid.UUID | str,
    ) -> bool:
        job = self.get_by_id(job_id)

        if job is None:
            return False

        self.db.delete(job)
        self.db.commit()

        return True

    @staticmethod
    def _to_uuid(value: uuid.UUID | str) -> uuid.UUID:
        if isinstance(value, uuid.UUID):
            return value

        return uuid.UUID(str(value))