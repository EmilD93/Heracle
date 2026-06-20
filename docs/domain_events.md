# Domain Events

Domain events are records that something important happened in the system.

The notification system should create notification jobs after registration, waitlist, promotion, or cancellation actions.

## Event Types

### RegistrationConfirmed

Created when a student registers for an event and gets a confirmed seat.

### RegistrationWaitlisted

Created when a student registers for a full event and is placed on the waitlist.

### WaitlistPromoted

Created when a waitlisted student is moved into a confirmed seat.

### EventCancelled

Created when an organizer or admin cancels an event.

## Rules

1. Domain events should happen after the database change succeeds.
2. The API should not send notifications directly.
3. Each event should create one or more `notification_jobs`.
4. Jobs should start with status `pending`.
5. The worker processes the job and writes to `notification_logs`.