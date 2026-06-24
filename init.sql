CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. USERS Table
-- Колаборация: Павел (Auth, Roles, Password Hash)
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT' CHECK (role IN ('STUDENT', 'ORGANIZER')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. EVENTS Table
-- Колаборация: Пламен (Capacity, Status, Organizer)
-- ==========================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INT NOT NULL CHECK (capacity > 0),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CANCELLED')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    organizer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_events_start_before_end CHECK (start_time < end_time)
);

-- ==========================================
-- 3. REGISTRATIONS Table
-- Уточнено с Валери: Запазва се position за стабилност, FIFO се води по created_at
-- ==========================================
CREATE TABLE registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'WAITLISTED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    position INT
);

-- ==========================================
-- 4. NOTIFICATION_JOBS Table
-- Колаборация: Роберта (Queue, Worker, Payload)
-- ==========================================
CREATE TABLE notification_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL,

    type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,

    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 3,

    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    locked_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_notification_job_type CHECK (
        type IN (
            'RegistrationConfirmed',
            'RegistrationWaitlisted',
            'WaitlistPromoted',
            'EventCancelled'
        )
    ),

    CONSTRAINT chk_notification_job_status CHECK (
        status IN (
            'pending',
            'processing',
            'completed',
            'failed'
        )
    )
);

-- ==========================================
-- 5. NOTIFICATION_LOGS Table
-- ==========================================
CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    job_id UUID NOT NULL REFERENCES notification_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,

    message TEXT,
    error_message TEXT,

    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_notification_log_status CHECK (
        status IN ('success', 'failed')
    )
);

-- ==========================================
-- INDEXES
-- ==========================================
-- users(email) е автоматичен от UNIQUE constraint
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_student_id ON registrations(student_id);
CREATE INDEX idx_notification_jobs_polling ON notification_jobs(status, scheduled_for);
CREATE INDEX idx_notification_jobs_user_id ON notification_jobs(user_id);
CREATE INDEX idx_notification_jobs_event_id ON notification_jobs(event_id);
CREATE INDEX idx_notification_jobs_registration_id ON notification_jobs(registration_id);

-- ==========================================
-- UNIQUE CONSTRAINTS (Ограничения)
-- ==========================================
-- Един потребител не може да има две активни регистрации за едно и също събитие
CREATE UNIQUE INDEX unique_active_registration ON registrations(student_id, event_id) WHERE status != 'CANCELLED';
