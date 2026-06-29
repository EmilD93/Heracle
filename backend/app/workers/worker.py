from __future__ import annotations

import json
import time
from typing import Any, Optional

from sqlalchemy import text
from sqlalchemy.orm import Session


def reset_stuck_jobs(db: Session) -> None:
    """
    If the worker crashes while a job is processing,
    this resets old processing jobs back to pending.
    """

    query = text(
        """
        UPDATE notification_jobs
        SET status = 'pending',
            locked_at = NULL
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '10 minutes';
        """
    )

    db.execute(query)


def get_next_pending_job(db: Session) -> Optional[dict[str, Any]]:
    """
    Finds the oldest pending notification job.

    FOR UPDATE SKIP LOCKED prevents two workers from processing
    the same job at the same time.
    """

    query = text(
        """
        SELECT *
        FROM notification_jobs
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        """
    )

    result = db.execute(query).mappings().first()

    if result is None:
        return None

    return dict(result)


def mark_job_processing(db: Session, job_id: str) -> None:
    query = text(
        """
        UPDATE notification_jobs
        SET status = 'processing',
            locked_at = NOW()
        WHERE id = :job_id;
        """
    )

    db.execute(query, {"job_id": job_id})


def mark_job_completed(db: Session, job_id: str) -> None:
    query = text(
        """
        UPDATE notification_jobs
        SET status = 'completed',
            completed_at = NOW(),
            error_message = NULL
        WHERE id = :job_id;
        """
    )

    db.execute(query, {"job_id": job_id})


def mark_job_failed(db: Session, job_id: str, error_message: str) -> None:
    query = text(
        """
        UPDATE notification_jobs
        SET status = 'failed',
            failed_at = NOW(),
            error_message = :error_message
        WHERE id = :job_id;
        """
    )

    db.execute(
        query,
        {
            "job_id": job_id,
            "error_message": error_message,
        },
    )


def retry_job(db: Session, job_id: str, error_message: str) -> None:
    query = text(
        """
        UPDATE notification_jobs
        SET status = 'pending',
            locked_at = NULL,
            attempt_count = attempt_count + 1,
            error_message = :error_message
        WHERE id = :job_id;
        """
    )

    db.execute(
        query,
        {
            "job_id": job_id,
            "error_message": error_message,
        },
    )


def create_notification_log(
    db: Session,
    job: dict[str, Any],
    status: str,
    message: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    query = text(
        """
        INSERT INTO notification_logs (
            job_id,
            user_id,
            type,
            status,
            message,
            error_message,
            sent_at
        )
        VALUES (
            :job_id,
            :user_id,
            :type,
            :status,
            :message,
            :error_message,
            NOW()
        );
        """
    )

    db.execute(
        query,
        {
            "job_id": job["id"],
            "user_id": job["user_id"],
            "type": job["type"],
            "status": status,
            "message": message,
            "error_message": error_message,
        },
    )


def send_notification(job: dict[str, Any]) -> str:
    """
    For now, this does not send a real email.

    It prints the notification so we can prove that the worker
    processed the notification job.
    """

    payload = job.get("payload") or {}

    if isinstance(payload, str):
        payload = json.loads(payload)

    message = payload.get("message", "Notification processed")

    print("Notification processed")
    print(f"Type: {job['type']}")
    print(f"User ID: {job['user_id']}")
    print(f"Event ID: {job['event_id']}")
    print(f"Message: {message}")

    return message


def run_worker_once(db: Session) -> Optional[dict[str, Any]]:
    """
    Processes one pending notification job.

    This is useful for testing without running an infinite worker loop.
    """

    try:
        reset_stuck_jobs(db)

        job = get_next_pending_job(db)

        if job is None:
            db.commit()
            print("No pending notification jobs found.")
            return None

        mark_job_processing(db, str(job["id"]))
        db.commit()

    except Exception:
        db.rollback()
        raise

    try:
        message = send_notification(job)

        create_notification_log(
            db=db,
            job=job,
            status="success",
            message=message,
        )

        mark_job_completed(db, str(job["id"]))

        db.commit()

        print(f"Job {job['id']} completed.")
        return job

    except Exception as error:
        db.rollback()

        error_message = str(error)
        next_attempt_count = job["attempt_count"] + 1

        try:
            create_notification_log(
                db=db,
                job=job,
                status="failed",
                error_message=error_message,
            )

            if next_attempt_count >= job["max_attempts"]:
                mark_job_failed(db, str(job["id"]), error_message)
            else:
                retry_job(db, str(job["id"]), error_message)

            db.commit()

        except Exception:
            db.rollback()
            raise

        print(f"Job {job['id']} failed: {error_message}")
        return job


def run_worker(db: Session, sleep_seconds: int = 5) -> None:
    """
    Main worker loop.

    Worker flow:
    1. Reset old stuck jobs.
    2. Find one pending job.
    3. Mark it as processing.
    4. Process the notification.
    5. Write a notification_logs row.
    6. Mark the job completed.
    7. Retry or fail the job if something goes wrong.
    """

    while True:
        run_worker_once(db)
        time.sleep(sleep_seconds)

if __name__ == "__main__":
    from backend.app.db.session import SessionLocal

    db = SessionLocal()

    try:
        run_worker(db)
    finally:
        db.close()