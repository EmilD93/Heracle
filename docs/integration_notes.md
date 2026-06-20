# Notification Integration Notes

The registration flow must call `create_notification_job()` in three places.

The registration backend code does not exist yet, so this document explains where the notification service should be connected later.

---

## 1. Confirmed Registration

When a student registers and the event has available seats:

1. Create registration with status `confirmed`.
2. Create notification job with type `RegistrationConfirmed`.

Example:

    create_notification_job(
        db=db,
        notification_type="RegistrationConfirmed",
        user_id=user_id,
        event_id=event_id,
        registration_id=registration_id,
        payload={
            "event_id": str(event_id),
            "user_id": str(user_id),
            "registration_id": str(registration_id),
            "message": "Your registration has been confirmed."
        }
    )

---

## 2. Waitlisted Registration

When a student registers and the event is full:

1. Create registration with status `waitlisted`.
2. Create notification job with type `RegistrationWaitlisted`.

Example:

    create_notification_job(
        db=db,
        notification_type="RegistrationWaitlisted",
        user_id=user_id,
        event_id=event_id,
        registration_id=registration_id,
        payload={
            "event_id": str(event_id),
            "user_id": str(user_id),
            "registration_id": str(registration_id),
            "message": "The event is full. You have been added to the waitlist."
        }
    )

---

## 3. Waitlist Promotion

When a confirmed student cancels and the first waitlisted student is promoted:

1. Change waitlisted registration status to `confirmed`.
2. Create notification job with type `WaitlistPromoted`.

Example:

    create_notification_job(
        db=db,
        notification_type="WaitlistPromoted",
        user_id=promoted_user_id,
        event_id=event_id,
        registration_id=promoted_registration_id,
        payload={
            "event_id": str(event_id),
            "user_id": str(promoted_user_id),
            "registration_id": str(promoted_registration_id),
            "message": "Good news! You have been promoted from the waitlist."
        }
    )

---

## Important Rule

The API should not send notifications directly.

The API should only create a row in `notification_jobs`.

The worker will later process the job and create a row in `notification_logs`.

---

## Summary for the Team

The notification module is ready to be connected when the registration backend is implemented.

Required integration points:

- after confirmed registration
- after waitlisted registration
- after waitlist promotion

The worker will process the created jobs asynchronously.