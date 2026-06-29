from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional
from uuid import UUID

from sqlalchemy import bindparam, text
from sqlalchemy.dialects.postgresql import JSONB


def create_notification_job(
    db,
    notification_type: str,
    user_id: UUID | str,
    event_id: UUID | str,
    registration_id: Optional[UUID | str],
    payload: Optional[dict[str, Any]] = None,
):
    """
    Creates a pending notification job.

    This does not send the notification.
    It only inserts a row into notification_jobs.
    """

    query = text(
        """
        INSERT INTO notification_jobs (
            type,
            status,
            user_id,
            event_id,
            registration_id,
            payload,
            scheduled_for
        )
        VALUES (
            :type,
            'pending',
            :user_id,
            :event_id,
            :registration_id,
            :payload,
            :scheduled_for
        )
        RETURNING id;
        """
    ).bindparams(
        bindparam("payload", type_=JSONB)
    )

    result = db.execute(
        query,
        {
            "type": notification_type,
            "user_id": str(user_id),
            "event_id": str(event_id),
            "registration_id": str(registration_id) if registration_id else None,
            "payload": payload or {},
            "scheduled_for": datetime.now(timezone.utc),
        },
    )

    return result.scalar_one()