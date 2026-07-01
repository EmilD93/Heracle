-- seed.sql
-- Clear existing data if needed
TRUNCATE TABLE notification_logs, notification_jobs, registrations, events, users CASCADE;

-- Insert Seed Users
-- Password for all is "password123". "hashed_password" is used as a dev bypass according to auth.py
INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'student@university.edu', '$2b$12$4k829Qjw9Eugcxb0Zlf/S.0y7xF59wF51dyoXInjnXJ0pnM9LgZ9G', 'STUDENT', 'Alice', 'Student'),
('22222222-2222-2222-2222-222222222222', 'organizer@university.edu', '$2b$12$4k829Qjw9Eugcxb0Zlf/S.0y7xF59wF51dyoXInjnXJ0pnM9LgZ9G', 'ORGANIZER', 'Bob', 'Organizer');

-- Insert Seed Events
INSERT INTO events (id, title, description, capacity, status, start_time, end_time, image, location, category, organizer_id) VALUES
('33333333-3333-3333-3333-333333333333', 'Advanced TypeScript Workshop', 'Deep dive into TS advanced features.', 50, 'PUBLISHED', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000', 'Room 101', 'Academic', '22222222-2222-2222-2222-222222222222'),
('44444444-4444-4444-4444-444444444444', 'Campus Tech Mixer', 'Networking event for tech enthusiasts.', 100, 'DRAFT', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000', 'Main Hall', 'Social', '22222222-2222-2222-2222-222222222222');

-- Insert Registrations
INSERT INTO registrations (student_id, event_id, status) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'CONFIRMED');

-- Insert Notification Jobs
INSERT INTO notification_jobs (event_id, type, payload, status, scheduled_for) VALUES
('33333333-3333-3333-3333-333333333333', 'EVENT_REMINDER', '{"message": "Workshop starts tomorrow!"}', 'pending', NOW() + INTERVAL '12 hours');
