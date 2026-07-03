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
('33333333-3333-3333-3333-333333333333', 'Advanced TypeScript Workshop', 'Deep dive into TS advanced features, including utility types, decorators, and generic constraints. Highly interactive!', 3, 'PUBLISHED', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000', 'Room 101, Computer Science Bldg', 'Academic', '22222222-2222-2222-2222-222222222222'),
('44444444-4444-4444-4444-444444444444', 'Campus Tech Mixer', 'Networking event for tech enthusiasts. Meet local startups and alumni over coffee and snacks!', 100, 'DRAFT', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days 3 hours', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000', 'Main Hall', 'Social', '22222222-2222-2222-2222-222222222222'),
('55555555-5555-5555-5555-555555555555', 'AI & Machine Learning Symposium', 'Join us for a full day symposium on the future of AI. Featuring guest speakers from top tech companies.', 150, 'PUBLISHED', NOW() + INTERVAL '14 days', NOW() + INTERVAL '14 days 6 hours', 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000', 'Auditorium A', 'Academic', '22222222-2222-2222-2222-222222222222'),
('66666666-6666-6666-6666-666666666666', 'Intramural Basketball Tournament', 'Annual 3v3 basketball tournament. Sign up your team and compete for the campus trophy!', 48, 'PUBLISHED', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 4 hours', 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=1000', 'University Gym', 'Sports', '22222222-2222-2222-2222-222222222222'),
('77777777-7777-7777-7777-777777777777', 'Career Fair 2026', 'Connect with over 50 top employers hiring for internships and full-time positions. Dress to impress!', 500, 'PUBLISHED', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days 8 hours', 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000', 'Campus Exhibition Center', 'Career', '22222222-2222-2222-2222-222222222222'),
('88888888-8888-8888-8888-888888888888', 'Hackathon: Code for Good', 'A 24-hour hackathon focused on building solutions for local non-profits. Food and energy drinks provided.', 80, 'PUBLISHED', NOW() + INTERVAL '21 days', NOW() + INTERVAL '22 days', 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000', 'Innovation Lab', 'Academic', '22222222-2222-2222-2222-222222222222');

-- Insert Registrations
INSERT INTO registrations (student_id, event_id, status) VALUES
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'CONFIRMED'),
('11111111-1111-1111-1111-111111111111', '66666666-6666-6666-6666-666666666666', 'CONFIRMED');

-- Insert Notification Jobs
INSERT INTO notification_jobs (event_id, user_id, type, payload, status, scheduled_for) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'RegistrationConfirmed', '{"message": "Workshop starts tomorrow!"}', 'pending', NOW() + INTERVAL '12 hours');
