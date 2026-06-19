# Domain Events

A Domain Event is a fact that already happened in the system.

It is not an API endpoint.
It is not called directly by the frontend.
It is created by backend business logic after something important happens.

## Events

### RegistrationConfirmed

Happens when a student registers for an event and there are available seats.

Payload example:

```json
{
  "event_id": "event-id",
  "user_id": "user-id",
  "registration_id": "registration-id",
  "event_title": "AI Workshop"
}