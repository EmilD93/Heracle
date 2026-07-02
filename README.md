# Heracle Event Management App

Welcome to the Heracle project! This application manages university events, allowing organizers to create, publish, and manage events, while students can browse and register for them.

## Setup & Running Locally

1. Make sure you have **Node.js** and **Python 3** installed.
2. The project relies on a Neon PostgreSQL database. The credentials are provided in the backend setup.
3. To start both the frontend and backend servers at once:

  **macOS/Linux**
  ```bash
  npm run up
  ```

  **Windows**
  - Double-click `run.bat`, or run:
   ```bash
   ./run.bat
   ```

4. Stop both servers with **Ctrl+C** in the same terminal where you started them.

## Notification Worker

The backend writes notification jobs into the `notification_jobs` table. The worker reads pending jobs, processes them, writes a row into `notification_logs`, and updates the job status.

Run the worker once:

```bash
cd backend
python -m app.workers.worker --once
```

Run the worker continuously:

```bash
cd backend
python -m app.workers.worker
```

### Expected flow

1. Register a student for an event.
2. A new row appears in `notification_jobs` with `status = 'pending'`.
3. Run the worker:

```bash
cd backend
python -m app.workers.worker --once
```

4. The job status becomes `completed`.
5. A `success` row appears in `notification_logs`.

### Failed job behavior

A job with this payload can be used to prove failure handling:

```json
{
  "force_fail": true,
  "message": "QA forced failure"
}
```

When the worker processes it, the job becomes `failed` and a failed row is written to `notification_logs`.

## Test Accounts

You can log in using the following predefined accounts for testing:

**Organizer Accounts:**
- **Sarah Jenkins** 
  - Email: `sarah.jenkins@university.edu`
  - Password: `any` (Password check is bypassed for predefined test accounts)

**Student Accounts:**
- **Michael Chen**
  - Email: `michael.chen@student.edu`
  - Password: `any`
- **Emma Wilson**
  - Email: `emma.wilson@student.edu`
  - Password: `any`

*Note: You can also register a new account on the Login screen if you wish to test registration.*

## Core Features
- **Student Dashboard:** View published events, filter by category, and register.
- **Organizer Dashboard:** Create events, save as drafts, publish, edit, and cancel events. View waitlist and registration charts.
- **My Events:** Students can see which events they are attending and cancel their registration.

## Architecture
- **Frontend:** React + Vite + Tailwind CSS + Framer Motion
- **Backend:** FastAPI (Python) + PostgreSQL (Neon)
- **Database Schema:** Defined in `backend/database_design.md` and populated automatically via `schema.sql` on startup.

If you encounter any issues with the UI not refreshing, make sure both servers (Vite on port 5173, FastAPI on port 8000) are running without errors.
