from __future__ import annotations

import argparse
import json
import time
from typing import Any, Optional

from app.database import pool


def reset_stuck_jobs(conn) -> None:
    """
    If the worker crashes while a job is processing,
    this resets old processing jobs back to pending.
    """

    conn.execute(
        """
        UPDATE notification_jobs
        SET status = 'pending',
            locked_at = NULL
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '10 minutes';
        """
    )


def get_next_pending_job(conn) -> Optional[dict[str, Any]]:
    """
    Finds and locks the oldest pending notification job.

    FOR UPDATE SKIP LOCKED prevents two workers from processing
    the same job at the same time.
    """

    result = conn.execute(
        """
        SELECT *
        FROM notification_jobs
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
        """
    ).fetchone()

    if result is None:
        return None

    return dict(result)


def mark_job_processing(conn, job_id: str) -> None:
    conn.execute(
        """
        UPDATE notification_jobs
        SET status = 'processing',
            locked_at = NOW()
        WHERE id = %s;
        """,
        (job_id,),
    )


def mark_job_completed(conn, job_id: str) -> None:
    conn.execute(
        """
        UPDATE notification_jobs
        SET status = 'completed',
            completed_at = NOW(),
            locked_at = NULL,
            error_message = NULL
        WHERE id = %s;
        """,
        (job_id,),
    )


def mark_job_failed(conn, job_id: str, error_message: str) -> None:
    conn.execute(
        """
        UPDATE notification_jobs
        SET status = 'failed',
            failed_at = NOW(),
            locked_at = NULL,
            attempt_count = attempt_count + 1,
            error_message = %s
        WHERE id = %s;
        """,
        (error_message, job_id),
    )


def retry_job(conn, job_id: str, error_message: str) -> None:
    conn.execute(
        """
        UPDATE notification_jobs
        SET status = 'pending',
            locked_at = NULL,
            attempt_count = attempt_count + 1,
            error_message = %s
        WHERE id = %s;
        """,
        (error_message, job_id),
    )


def create_notification_log(
    conn,
    job: dict[str, Any],
    status: str,
    message: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    conn.execute(
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
        VALUES (%s, %s, %s, %s, %s, %s, NOW());
        """,
        (
            job["id"],
            job["user_id"],
            job["type"],
            status,
            message,
            error_message,
        ),
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


def run_worker_once() -> Optional[dict[str, Any]]:
    """
    Processes one pending notification job.
    This is useful for testing without running an infinite worker loop.
    """

    with pool.connection() as conn:
        try:
            with conn.transaction():
                reset_stuck_jobs(conn)
                job = get_next_pending_job(conn)

                if job is None:
                    print("No pending notification jobs found.")
                    return None

                mark_job_processing(conn, str(job["id"]))

            try:
                message = send_notification(job)

                with conn.transaction():
                    create_notification_log(
                        conn=conn,
                        job=job,
                        status="success",
                        message=message,
                    )
                    mark_job_completed(conn, str(job["id"]))

                print(f"Job {job['id']} completed.")
                return job

            except Exception as error:
                error_message = str(error)
                next_attempt_count = job["attempt_count"] + 1

                with conn.transaction():
                    create_notification_log(
                        conn=conn,
                        job=job,
                        status="failed",
                        error_message=error_message,
                    )

                    if next_attempt_count >= job["max_attempts"]:
                        mark_job_failed(conn, str(job["id"]), error_message)
                    else:
                        retry_job(conn, str(job["id"]), error_message)

                print(f"Job {job['id']} failed: {error_message}")
                return job

        except Exception:
            conn.rollback()
            raise


def run_worker(sleep_seconds: int = 5) -> None:
    """
    Main worker loop.
    """

    print("Notification worker started.")
    print("Press Ctrl+C to stop.")

    while True:
        run_worker_once()
        time.sleep(sleep_seconds)


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the notification worker")
    parser.add_argument(
        "--once",
        action="store_true",
        help="Process one pending job and then stop",
    )
    parser.add_argument(
        "--sleep-seconds",
        type=int,
        default=5,
        help="Seconds to wait between checks in continuous mode",
    )

    args = parser.parse_args()

    if args.once:
        run_worker_once()
    else:
        run_worker(sleep_seconds=args.sleep_seconds)


if __name__ == "__main__":
    try:
        main()
    finally:
        pool.close()