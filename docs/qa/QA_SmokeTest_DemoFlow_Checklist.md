# Smoke Test Checklist — Demo Flow

> **Action Item:** Prepare Smoke Test Checklist for the demo flow  
> **Owner:** Plamen Ch.  
> **Priority:** MEDIUM  
> **Due Date:** Today 21:00  
> **Status:** In Progress  
> **Дата на създаване:** 30 юни 2026

---

## 📋 Demo Flow — End-to-End Scenario

```
Organizer login → Create event → Publish event
→ Student login → Student sees published event → Student registers
→ Registration status: CONFIRMED or WAITLISTED
→ notification_jobs row is created
→ Worker processes job
→ notification_logs row is created
```

---

## 1. Organizer Flow

### 1.1 Organizer Login

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 1.1 | Organizer може да отвори Login страница | 1. Отвори приложението<br>2. Натисни "Login" | Login формата се зарежда (< 3 сек) | ☐ Pass ☐ Fail ☐ Blocked | | |
| 1.2 | Organizer login с валидни credentials | 1. Въведи organizer имейл<br>2. Въведи парола<br>3. Натисни "Login" | Успешен вход. Пренасочване към Dashboard. Връща се token. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 1.3 | Login response съдържа необходимите полета | 1. Провери response от `/api/auth/login` | Response съдържа: token/access_token, user обект с role="organizer" | ☐ Pass ☐ Fail ☐ Blocked | | |

### 1.2 Create Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 2.1 | Organizer може да отвори "Create Event" | 1. Натисни "Create Event" от Dashboard | Формата за създаване се зарежда с всички полета | ☐ Pass ☐ Fail ☐ Blocked | | |
| 2.2 | Създаване на събитие с валидни данни | 1. Въведи Title<br>2. Въведи Description<br>3. Избери Start Time (бъдеща дата)<br>4. Въведи Location<br>5. Избери Category<br>6. Въведи Capacity<br>7. Натисни "Create" | Event е създаден. HTTP 201. Response съдържа event id, title, start_time, location, capacity, category. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 2.3 | Backend връща правилна структура за event | 1. Провери response от `/api/events` | Полетата съвпадат с очакваните от frontend: id, title, description, capacity, start_time, location, category | ☐ Pass ☐ Fail ☐ Blocked | | |

### 1.3 Publish Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 3.1 | Organizer може да публикува събитие | 1. Отвори създаденото събитие<br>2. Натисни "Publish" | Събитието е публикувано. Статусът се променя на "published". Видимо е за students. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 3.2 | Публикувано събитие се вижда в публичния списък | 1. Отвори Events страница (без login) | Събитието се показва в списъка с всички публични полета | ☐ Pass ☐ Fail ☐ Blocked | | |

---

## 2. Student Flow

### 2.1 Student Login

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 4.1 | Student може да отвори Login страница | 1. Отвори приложението<br>2. Натисни "Login" | Login формата се зарежда | ☐ Pass ☐ Fail ☐ Blocked | | |
| 4.2 | Student login с валидни credentials | 1. Въведи student имейл<br>2. Въведи парола<br>3. Натисни "Login" | Успешен вход. Пренасочване към Student Dashboard. Връща се token. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 4.3 | Login response съдържа role="student" | 1. Провери response от `/api/auth/login` | Response съдържа user обект с role="student" | ☐ Pass ☐ Fail ☐ Blocked | | |

### 2.2 Student Sees Published Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 5.1 | Student вижда публикуваното събитие | 1. Отвори Events страница | Събитието, публикувано от organizer, се показва в списъка | ☐ Pass ☐ Fail ☐ Blocked | | |
| 5.2 | Event details са коректни | 1. Натисни върху събитието | Показват се: title, description, start_time, location, category, capacity, available spots | ☐ Pass ☐ Fail ☐ Blocked | | |

### 2.3 Student Registers

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 6.1 | Student може да се регистрира за събитие | 1. Отвори детайлите на събитието<br>2. Натисни "Register" | Показва се потвърждение за регистрация. HTTP 200/201. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.2 | Registration response съдържа правилните полета | 1. Провери response от `/api/registrations` | Response съдържа: status, position, registration_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.3 | Registration status е CONFIRMED (ако има място) | 1. Провери response | status === "CONFIRMED" когато capacity не е достигната | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.4 | Registration status е WAITLISTED (ако няма място) | 1. Напълни capacity<br>2. Опитай нова регистрация | status === "WAITLISTED" когато capacity е достигната | ☐ Pass ☐ Fail ☐ Blocked | | |

---

## 3. Notification Flow

### 3.1 Notification Jobs

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 7.1 | notification_jobs row е създаден при регистрация | 1. Регистрирай student за събитие<br>2. Провери таблицата notification_jobs | Има нов ред с job_type="registration_notification", status="pending", свързан с registration_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.2 | Worker обработва job-а | 1. Изчакай worker-а да процесне опашката<br>2. Провери логовете | Worker логва обработка на job. Няма грешки. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.3 | notification_logs row е създаден след обработка | 1. Провери таблицата notification_logs след worker | Има нов ред със статус "sent" или "delivered", свързан с job_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.4 | Student получава нотификация | 1. Провери имейл/ин-app нотификация | Student вижда нотификация за успешна регистрация | ☐ Pass ☐ Fail ☐ Blocked | | |

---

## 4. Execution Summary

### 4.1 Обобщение

| Фаза | Общо Checks | Pass | Fail | Blocked | Pass Rate |
|------|------------|------|------|---------|-----------|
| Organizer Login | 3 | | | | % |
| Create Event | 3 | | | | % |
| Publish Event | 2 | | | | % |
| Student Login | 3 | | | | % |
| See Published Event | 2 | | | | % |
| Student Registration | 4 | | | | % |
| Notification Flow | 4 | | | | % |
| **ОБЩО** | **21** | | | | **%** |

### 4.2 Failed / Blocked Items — Owners

| # | Check # | Описание | Статус | Owner | Действие |
|---|---------|----------|--------|-------|----------|
| 1 | | | Fail / Blocked | | |
| 2 | | | Fail / Blocked | | |
| 3 | | | Fail / Blocked | | |

### 4.3 Критерии за приемане

- ✅ Има checklist с Pass / Fail / Blocked колони
- ✅ Всеки failed/blocking item има owner
- ✅ Всички 21 check items са изпълнени или документирани

---

*Документът е създаден от Plamen Ch. като част от QA дейностите в Team Project.*
