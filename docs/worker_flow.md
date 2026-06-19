# Worker Flow

The worker is a separate process from the API.

The API should stay fast. It should not send notifications directly.

## Flow

```mermaid
flowchart TD
    A[Student registers for event] --> B[API updates registrations table]
    B --> C[API creates Domain Event]
    C --> D[API inserts notification job]
    D --> E[Worker reads pending jobs]
    E --> F[Worker marks job as processing]
    F --> G[Worker sends or logs notification]
    G --> H[Worker writes notification_logs row]
    H --> I[Worker marks job as completed]