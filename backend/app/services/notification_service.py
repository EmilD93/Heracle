from __future__ import annotations

from typing import Any, Optional

from psycopg.types.json import Jsonb


def create_notification_job(
    db,
    notification_type: str,
    user_id: str,
    event_id: str,
    registration_id: Optional[str],
    payload: Optional[dict[str, Any]] = None,
):
    """
    Creates a pending notification job using the same psycopg connection
    style as the rest of the backend.

    This does not send the notification. It only inserts a row into
    notification_jobs so the worker can process it later.
    """

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
        RETURNING id;
        """,
        (
            notification_type,
            user_id,
            event_id,
            registration_id,
            Jsonb(payload or {}),
        ),
    ).fetchone()

    return result["id"]