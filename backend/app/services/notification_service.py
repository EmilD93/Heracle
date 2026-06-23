import json
from datetime import datetime, timezone
from typing import Optional


def create_notification_job(
    db,
    notification_type: str,
    user_id: str,
    event_id: str,
    registration_id: Optional[str],
    payload: dict
):
    """
    Creates a notification job.

    This function is called by the API after something important happens,
    for example:
    - RegistrationConfirmed
    - RegistrationWaitlisted
    - WaitlistPromoted

    The API does not send the notification directly.
    It only creates a pending job.
    The worker processes the job later.
    """

    query = """
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
    """

    db.execute(query, {
        "type": notification_type,
        "user_id": user_id,
        "event_id": event_id,
        "registration_id": registration_id,
        "payload": json.dumps(payload),
        "scheduled_for": datetime.now(timezone.utc)
    })