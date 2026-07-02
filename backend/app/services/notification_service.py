from __future__ import annotations

from typing import Any

from psycopg.types.json import Jsonb


def ensure_notification_schema(db) -> None:
    """Keeps notification table shape aligned for seen-state + new job types."""
    db.execute("ALTER TABLE notification_jobs ADD COLUMN IF NOT EXISTS seen_at TIMESTAMPTZ")
    db.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM pg_constraint c
                WHERE c.conname = 'chk_notification_job_type'
                  AND c.conrelid = 'notification_jobs'::regclass
                  AND pg_get_constraintdef(c.oid) LIKE '%EventUpdated%'
            ) THEN
                IF EXISTS (
                    SELECT 1
                    FROM pg_constraint c
                    WHERE c.conname = 'chk_notification_job_type'
                      AND c.conrelid = 'notification_jobs'::regclass
                ) THEN
                    ALTER TABLE notification_jobs DROP CONSTRAINT chk_notification_job_type;
                END IF;

                ALTER TABLE notification_jobs
                ADD CONSTRAINT chk_notification_job_type CHECK (
                    type IN (
                        'RegistrationConfirmed',
                        'RegistrationWaitlisted',
                        'WaitlistPromoted',
                        'EventCancelled',
                        'EventUpdated'
                    )
                );
            END IF;
        END
        $$;
        """
    )


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
    ensure_notification_schema(db)
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
