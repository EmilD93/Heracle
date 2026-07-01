# Database Setup

## Prerequisites
- PostgreSQL running locally or Neon Database.
- `.env` configured with `DATABASE_URL`

## Resetting the Database

To reset the database and seed it with initial data, run the provided Python script from the `backend/` folder:

```bash
cd backend
python reset_db.py
```

This will:
1. Drop existing tables to ensure a clean state.
2. Run `init.sql` to recreate tables, indexes, and constraints.
3. Run `seed.sql` to insert seed data.

## Seed Users
All seed users have the password: `password123`

- **Student:** `student@university.edu`
- **Organizer:** `organizer@university.edu`
