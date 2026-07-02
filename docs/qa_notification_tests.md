# QA Tests for Notification Worker

## Purpose

This document describes the QA tests for the event-driven notification module.

The goal is to verify that registration actions create notification jobs and that the worker processes those jobs correctly.

---

## Critical Demo Scenario

Event capacity = 3.

### Steps

1. Student A registers for the event.
2. Student B registers for the event.
3. Student C registers for the event.
4. Student D tries to register for the same event.
5. Student B cancels their registration.
6. Worker processes pending notification jobs.

### Expected Result

- Student A status is `confirmed`.
- Student B status becomes `cancelled`.
- Student C status is `confirmed`.
- Student D is first `waitlisted`.
- After Student B cancels, Student D becomes `confirmed`.
- A `WaitlistPromoted` notification job is created for Student D.
- Worker processes the job.
- `notification_logs` contains a `success` row.

---

## Test Case 1: Registration Confirmed

### Action

Student registers for an event with available capacity.

### Expected Database Result

In `registrations`:

    status = confirmed

In `notification_jobs`:

    type = RegistrationConfirmed
    status = pending

### Worker Expected Result

After the worker runs:

    notification_jobs.status = completed
    notification_logs.status = success

---

## Test Case 2: Registration Waitlisted

### Action

Student registers for an event that is already full.

### Expected Database Result

In `registrations`:

    status = waitlisted

In `notification_jobs`:

    type = RegistrationWaitlisted
    status = pending

### Worker Expected Result

After the worker runs:

    notification_jobs.status = completed
    notification_logs.status = success

---

## Test Case 3: Waitlist Promotion

### Action

A confirmed student cancels their registration.

### Expected Database Result

The first waitlisted student is promoted.

In `registrations`:

    old status = waitlisted
    new status = confirmed

In `notification_jobs`:

    type = WaitlistPromoted
    status = pending

### Worker Expected Result

After the worker runs:

    notification_jobs.status = completed
    notification_logs.status = success

---

## Test Case 4: Worker Failure

### Action

Worker fails while processing a job.

### Expected Result

- Error is saved.
- `attempt_count` increases.
- If attempts are still available, job returns to `pending`.
- If max attempts are reached, job becomes `failed`.
- `notification_logs.status = failed`.

---

## Test Case 5: Stuck Processing Job

### Action

Worker crashes while a job has status `processing`.

### Expected Result

A recovery query resets the old processing job back to `pending`.

    UPDATE notification_jobs
    SET status = 'pending',
        locked_at = NULL
    WHERE status = 'processing'
      AND locked_at < NOW() - INTERVAL '10 minutes';

---

## QA Checklist

| Test | Expected Result |
|---|---|
| Register with free seats | Registration confirmed + `RegistrationConfirmed` job |
| Register when full | Registration waitlisted + `RegistrationWaitlisted` job |
| Cancel confirmed registration | First waitlisted student promoted |
| Waitlist promotion | `WaitlistPromoted` job created |
| Worker processes job | Job becomes `completed` |
| Worker succeeds | Notification log has `success` |
| Worker fails | Notification log has `failed` |
| Worker crashes | Old processing jobs can be reset |