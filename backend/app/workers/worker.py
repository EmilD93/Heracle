import time
import json


def reset_stuck_jobs(db):
    """
    If the worker crashes while a job is processing,
    this resets old processing jobs back to pending.
    """

    query = """
        UPDATE notification_jobs
        SET status = 'pending',
            locked_at = NULL
        WHERE status = 'processing'
          AND locked_at < NOW() - INTERVAL '10 minutes';
    """

    db.execute(query)


def get_next_pending_job(db):
    """
    Finds the oldest pending job.

    FOR UPDATE SKIP LOCKED prevents two workers from processing
    the same job at the same time.
    """

    query = """
        SELECT *
        FROM notification_jobs
        WHERE status = 'pending'
          AND scheduled_for <= NOW()
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED;
    """

    return db.fetch_one(query)


def mark_job_processing(db, job_id):
    query = """
        UPDATE notification_jobs
        SET status = 'processing',
            locked_at = NOW()
        WHERE id = :job_id;
    """

    db.execute(query, {"job_id": job_id})


def mark_job_completed(db, job_id):
    query = """
        UPDATE notification_jobs
        SET status = 'completed',
            completed_at = NOW()
        WHERE id = :job_id;
    """

    db.execute(query, {"job_id": job_id})


def mark_job_failed(db, job_id, error_message):
    query = """
        UPDATE notification_jobs
        SET status = 'failed',
            failed_at = NOW(),
            error_message = :error_message
        WHERE id = :job_id;
    """

    db.execute(query, {
        "job_id": job_id,
        "error_message": error_message
    })


def retry_job(db, job_id, error_message):
    query = """
        UPDATE notification_jobs
        SET status = 'pending',
            attempt_count = attempt_count + 1,
            error_message = :error_message
        WHERE id = :job_id;
    """

    db.execute(query, {
        "job_id": job_id,
        "error_message": error_message
    })


def create_notification_log(db, job, status, message=None, error_message=None):
    query = """
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

    db.execute(query, {
        "job_id": job["id"],
        "user_id": job["user_id"],
        "type": job["type"],
        "status": status,
        "message": message,
        "error_message": error_message
    })


def send_notification(job):
    """
    For the first project version, this does not send a real email.
    It prints the notification so we can prove the worker processed the job.
    """

    payload = job["payload"]

    if isinstance(payload, str):
        payload = json.loads(payload)

    message = payload.get("message", "Notification processed")

    print("Notification processed")
    print(f"Type: {job['type']}")
    print(f"User ID: {job['user_id']}")
    print(f"Message: {message}")

    return message

def run_worker_once(db):
    """
    Processes one pending notification job.

    This is useful for testing the worker prototype without running
    an infinite loop.
    """

    reset_stuck_jobs(db)

    job = get_next_pending_job(db)

    if job is None:
        print("No pending notification jobs found.")
        return None

    try:
        mark_job_processing(db, job["id"])

        message = send_notification(job)

        create_notification_log(
            db=db,
            job=job,
            status="success",
            message=message
        )

        mark_job_completed(db, job["id"])

        print(f"Job {job['id']} completed.")
        return job

    except Exception as error:
        error_message = str(error)

        create_notification_log(
            db=db,
            job=job,
            status="failed",
            error_message=error_message
        )

        next_attempt_count = job["attempt_count"] + 1

        if next_attempt_count >= job["max_attempts"]:
            mark_job_failed(db, job["id"], error_message)
        else:
            retry_job(db, job["id"], error_message)

        print(f"Job {job['id']} failed: {error_message}")
        return job

def run_worker(db):
    """
    Main worker loop.

    Worker algorithm:
    1. Reset old stuck jobs.
    2. Find pending jobs.
    3. Mark job as processing.
    4. Process notification.
    5. Save notification log.
    6. Mark job as completed.
    7. Retry or fail if an error happens.
    """

    while True:
        run_worker_once(db)
        time.sleep(5)