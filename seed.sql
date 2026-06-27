-- ==========================================
-- SEED DATA FOR DEVELOPMENT ENVIRONMENT
-- ==========================================

-- 1. Seed Users (1 Organizer, 3 Students)
INSERT INTO users (id, email, password_hash, role, first_name, last_name) VALUES
('11111111-1111-1111-1111-111111111111', 'organizer@heracle.com', 'hashed_password_123', 'ORGANIZER', 'Ivan', 'Ivanov'),
('22222222-2222-2222-2222-222222222222', 'student1@heracle.com', 'hashed_password_123', 'STUDENT', 'Maria', 'Georgieva'),
('33333333-3333-3333-3333-333333333333', 'student2@heracle.com', 'hashed_password_123', 'STUDENT', 'Petar', 'Petrov'),
('44444444-4444-4444-4444-444444444444', 'student3@heracle.com', 'hashed_password_123', 'STUDENT', 'Elena', 'Dimitrova');

-- 2. Seed Events (1 Published, 1 Draft)
INSERT INTO events (id, title, description, capacity, status, start_time, end_time, organizer_id) VALUES
('55555555-5555-5555-5555-555555555555', 'Intro to React', 'A beginner friendly React workshop.', 2, 'PUBLISHED', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 2 hours', '11111111-1111-1111-1111-111111111111'),
('66666666-6666-6666-6666-666666666666', 'Advanced TypeScript', 'Deep dive into TS architecture.', 50, 'DRAFT', NOW() + INTERVAL '10 days', NOW() + INTERVAL '10 days 3 hours', '11111111-1111-1111-1111-111111111111');

-- 3. Seed Registrations 
-- The "Intro to React" event has capacity = 2. We will register 3 students to simulate the waitlist.
INSERT INTO registrations (id, student_id, event_id, status, position) VALUES
('77777777-7777-7777-7777-777777777771', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', 'CONFIRMED', 1),
('77777777-7777-7777-7777-777777777772', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 'CONFIRMED', 2),
('77777777-7777-7777-7777-777777777773', '44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555', 'WAITLISTED', 3);

-- 4. Seed Notification Jobs
-- Simulating a pending reminder job for the upcoming event.
INSERT INTO notification_jobs (id, event_id, type, payload, status, scheduled_for) VALUES
('88888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', 'REMINDER', '{"message": "Event starts in 24 hours!"}', 'pending', NOW() + INTERVAL '1 day');

-- 5. Seed Notification Logs
-- Simulating a past successful notification log.
INSERT INTO notification_logs (id, job_id, user_id, status, error_message, sent_at) VALUES
('99999999-9999-9999-9999-999999999999', '88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', 'success', NULL, NOW() - INTERVAL '1 hour');
