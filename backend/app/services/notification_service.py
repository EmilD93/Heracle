from __future__ import annotations

from typing import Any

from psycopg.types.json import Jsonb


def create_notification_job(
    db,
    *,
    notification_type: str,
    user_id: str,
    event_id: str,
    registration_id: str | None,
    payload: dict[str, Any] | None = None,
) -> str:
    """Create a pending row in notification_jobs and return the job id."""
    result = db.execute(
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
        VALUES (%s, 'pending', %s, %s, %s, %s, NOW())
        RETURNING id
        """,
        (
            notification_type,
            user_id,
            event_id,
            registration_id,
            Jsonb(payload or {}),
        ),
    ).fetchone()

    return str(result["id"])
