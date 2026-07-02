# QA Execution — Integrated Demo Flow

> **Action Item:** Execute QA on integrated demo flow  
> **Owner:** Plamen Ch.  
> **Priority:** HIGH  
> **Due Date:** Wednesday 21:00  
> **Status:** In Progress  
> **Дата на създаване:** 03 юли 2026

---

## 📋 Съдържание

1. [Populated Smoke Test Checklist](#1-populated-smoke-test-checklist)
2. [API Contract Validation — Реални резултати](#2-api-contract-validation--реални-резултати)
3. [Bug List с Severity и Owner](#3-bug-list-с-severity-и-owner)
4. [Retest след Fixes](#4-retest-след-fixes)
5. [Final Demo Readiness Note](#5-final-demo-readiness-note)

---

## 1. Populated Smoke Test Checklist

### 1.1 Demo Flow — End-to-End Scenario

```
Organizer login → Create event → Publish event
→ Student login → Student sees published event → Student registers
→ Registration status: CONFIRMED or WAITLISTED
→ notification_jobs row is created
→ Worker processes job
→ notification_logs row is created
```

### 1.2 Organizer Flow

#### 1.2.1 Organizer Login

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 1.1 | Organizer може да отвори Login страница | 1. Отвори приложението<br>2. Натисни "Login" | Login формата се зарежда (< 3 сек) | ☐ Pass ☐ Fail ☐ Blocked | | |
| 1.2 | Organizer login с валидни credentials | 1. Въведи organizer имейл<br>2. Въведи парола<br>3. Натисни "Login" | Успешен вход. Пренасочване към Dashboard. Връща се token. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 1.3 | Login response съдържа необходимите полета | 1. Провери response от `/api/auth/login` | Response съдържа: token/access_token, user обект с role="organizer" | ☐ Pass ☐ Fail ☐ Blocked | | |

#### 1.2.2 Create Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 2.1 | Organizer може да отвори "Create Event" | 1. Натисни "Create Event" от Dashboard | Формата за създаване се зарежда с всички полета | ☐ Pass ☐ Fail ☐ Blocked | | |
| 2.2 | Създаване на събитие с валидни данни | 1. Въведи Title<br>2. Въведи Description<br>3. Избери Start Time (бъдеща дата)<br>4. Въведи Location<br>5. Избери Category<br>6. Въведи Capacity<br>7. Натисни "Create" | Event е създаден. HTTP 201. Response съдържа event id, title, start_time, location, capacity, category. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 2.3 | Backend връща правилна структура за event | 1. Провери response от `/api/events` | Полетата съвпадат с очакваните от frontend: id, title, description, capacity, start_time, location, category | ☐ Pass ☐ Fail ☐ Blocked | | |

#### 1.2.3 Publish Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 3.1 | Organizer може да публикува събитие | 1. Отвори създаденото събитие<br>2. Натисни "Publish" | Събитието е публикувано. Статусът се променя на "published". Видимо е за students. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 3.2 | Публикувано събитие се вижда в публичния списък | 1. Отвори Events страница (без login) | Събитието се показва в списъка с всички публични полета | ☐ Pass ☐ Fail ☐ Blocked | | |

### 1.3 Student Flow

#### 1.3.1 Student Login

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 4.1 | Student може да отвори Login страница | 1. Отвори приложението<br>2. Натисни "Login" | Login формата се зарежда | ☐ Pass ☐ Fail ☐ Blocked | | |
| 4.2 | Student login с валидни credentials | 1. Въведи student имейл<br>2. Въведи парола<br>3. Натисни "Login" | Успешен вход. Пренасочване към Student Dashboard. Връща се token. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 4.3 | Login response съдържа role="student" | 1. Провери response от `/api/auth/login` | Response съдържа user обект с role="student" | ☐ Pass ☐ Fail ☐ Blocked | | |

#### 1.3.2 Student Sees Published Event

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 5.1 | Student вижда публикуваното събитие | 1. Отвори Events страница | Събитието, публикувано от organizer, се показва в списъка | ☐ Pass ☐ Fail ☐ Blocked | | |
| 5.2 | Event details са коректни | 1. Натисни върху събитието | Показват се: title, description, start_time, location, category, capacity, available spots | ☐ Pass ☐ Fail ☐ Blocked | | |

#### 1.3.3 Student Registers

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 6.1 | Student може да се регистрира за събитие | 1. Отвори детайлите на събитието<br>2. Натисни "Register" | Показва се потвърждение за регистрация. HTTP 200/201. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.2 | Registration response съдържа правилните полета | 1. Провери response от `/api/registrations` | Response съдържа: status, position, registration_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.3 | Registration status е CONFIRMED (ако има място) | 1. Провери response | status === "CONFIRMED" когато capacity не е достигната | ☐ Pass ☐ Fail ☐ Blocked | | |
| 6.4 | Registration status е WAITLISTED (ако няма място) | 1. Напълни capacity<br>2. Опитай нова регистрация | status === "WAITLISTED" когато capacity е достигната | ☐ Pass ☐ Fail ☐ Blocked | | |

### 1.4 Notification Flow

| # | Check Item | Стъпки | Очакван резултат | Статус | Owner | Бележки |
|---|------------|--------|------------------|--------|-------|---------|
| 7.1 | notification_jobs row е създаден при регистрация | 1. Регистрирай student за събитие<br>2. Провери таблицата notification_jobs | Има нов ред с job_type="registration_notification", status="pending", свързан с registration_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.2 | Worker обработва job-а | 1. Изчакай worker-а да процесне опашката<br>2. Провери логовете | Worker логва обработка на job. Няма грешки. | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.3 | notification_logs row е създаден след обработка | 1. Провери таблицата notification_logs след worker | Има нов ред със статус "sent" или "delivered", свързан с job_id | ☐ Pass ☐ Fail ☐ Blocked | | |
| 7.4 | Student получава нотификация | 1. Провери имейл/ин-app нотификация | Student вижда нотификация за успешна регистрация | ☐ Pass ☐ Fail ☐ Blocked | | |

### 1.5 Smoke Test Execution Summary

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

---

## 2. API Contract Validation — Реални резултати

> **Дата на проверка:** [Да се попълни след изпълнение]  
> **Изпълнил:** Plamen Ch.

### 2.1 Login Response — `POST /api/auth/login`

#### Frontend Expectations

| Поле | Тип | Задължително |
|------|-----|--------------|
| token / access_token | string | ✅ Да |
| user | object | ✅ Да |
| user.id | string/int | ✅ Да |
| user.email | string | ✅ Да |
| user.first_name | string | ✅ Да |
| user.last_name | string | ✅ Да |
| user.role | string | ✅ Да |

#### Backend Response (Реално)

```json
{
  "[Да се попълни от Plamen след тест]": "[Да се попълни]"
}
```

| Поле (Backend) | Налично | Съвпада с Frontend | Бележки |
|----------------|---------|-------------------|---------|
| token | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| access_token | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.id | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.email | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.first_name | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.last_name | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.role | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 2.2 Event Response — `GET /api/events` / `POST /api/events`

#### Frontend Expectations

| Поле | Тип | Задължително |
|------|-----|--------------|
| id | string/int | ✅ Да |
| title | string | ✅ Да |
| description | string | ✅ Да |
| capacity | int | ✅ Да |
| start_time | datetime | ✅ Да |
| location | string | ✅ Да |
| category | string | ✅ Да |
| status | string | ✅ Да |
| organizer_id | string/int | ✅ Да |

#### Backend Response (Реално)

```json
{
  "[Да се попълни от Plamen след тест]": "[Да се попълни]"
}
```

| Поле (Backend) | Налично | Съвпада с Frontend | Бележки |
|----------------|---------|-------------------|---------|
| id | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| title | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| description | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| capacity | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| start_time | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| location | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| category | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| status | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| organizer_id | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 2.3 Registration Response — `POST /api/registrations`

#### Frontend Expectations

| Поле | Тип | Задължително |
|------|-----|--------------|
| registration_id | string/int | ✅ Да |
| status | string | ✅ Да |
| position | int | ☐ Не |
| event_id | string/int | ✅ Да |
| student_id | string/int | ✅ Да |
| registered_at | datetime | ✅ Да |

#### Backend Response (Реално)

```json
{
  "[Да се попълни от Plamen след тест]": "[Да се попълни]"
}
```

| Поле (Backend) | Налично | Съвпада с Frontend | Бележки |
|----------------|---------|-------------------|---------|
| registration_id / id | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| status | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| position | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| event_id | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| student_id | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| registered_at / created_at | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 2.4 Несъответствия — Обобщена таблица

| # | Endpoint | Поле | Проблем | Frontend очаква | Backend връща | Owner | Статус |
|---|----------|------|---------|-----------------|---------------|-------|--------|
| 1 | | | | | | | ☐ Open ☐ Fixed |
| 2 | | | | | | | ☐ Open ☐ Fixed |
| 3 | | | | | | | ☐ Open ☐ Fixed |

---

## 3. Bug List с Severity и Owner

### 3.1 Severity Definitions

| Ниво | Описание |
|------|----------|
| **Blocker** | Demo flow не може да продължи |
| **Critical** | Основна функция не работи |
| **Major** | Работи, но грешно |
| **Minor** | UI / Cosmetic |

### 3.2 Blocker Bugs

| Bug ID | Title | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|-------|--------|-------|----------|--------|------|
| BUG-001 | | | New | | | | |
| BUG-002 | | | New | | | | |

### 3.3 Critical Bugs

| Bug ID | Title | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|-------|--------|-------|----------|--------|------|
| BUG-003 | | | New | | | | |
| BUG-004 | | | New | | | | |

### 3.4 Major Bugs

| Bug ID | Title | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|-------|--------|-------|----------|--------|------|
| BUG-005 | | | New | | | | |
| BUG-006 | | | New | | | | |

### 3.5 Minor Bugs

| Bug ID | Title | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|-------|--------|-------|----------|--------|------|
| BUG-007 | | | New | | | | |
| BUG-008 | | | New | | | | |

### 3.6 Bug Summary

| Severity | Брой | Fixed | In Progress | New |
|----------|------|-------|-------------|-----|
| Blocker | | | | |
| Critical | | | | |
| Major | | | | |
| Minor | | | | |
| **ОБЩО** | | | | |

---

## 4. Retest след Fixes

> **Дата на retest:** [Да се попълни]  
> **Изпълнил:** Plamen Ch.

### 4.1 Retest Log

| Bug ID | Title | Първоначален статус | Fix Owner | Дата на fix | Retest статус | Бележки |
|--------|-------|---------------------|-----------|-------------|---------------|---------|
| | | | | | ☐ Pass ☐ Fail | |
| | | | | | ☐ Pass ☐ Fail | |
| | | | | | ☐ Pass ☐ Fail | |

### 4.2 Regression Checks

| # | Проверка | Статус | Бележки |
|---|----------|--------|---------|
| 1 | Всички предишно Pass-нати тестове все още работят | ☐ Pass ☐ Fail | |
| 2 | Няма нови бъгове след fix-овете | ☐ Pass ☐ Fail | |
| 3 | Demo flow може да се изпълни end-to-end | ☐ Pass ☐ Fail | |

---

## 5. Final Demo Readiness Note

### 5.1 Критерии за приемане

- ✅ Всеки demo step е Pass / Fail / Blocked
- ✅ Всеки blocker има owner
- ✅ Има кратко заключение дали проектът е готов за demo

### 5.2 Demo Readiness Assessment

| Критерий | Статус | Бележки |
|----------|--------|---------|
| Organizer може да логне и създаде event | ☐ Готов ☐ Не готов | |
| Event може да се публикува | ☐ Готов ☐ Не готов | |
| Student може да логне и види event | ☐ Готов ☐ Не готов | |
| Student може да се регистрира | ☐ Готов ☐ Не готов | |
| Registration status е коректен (CONFIRMED/WAITLISTED) | ☐ Готов ☐ Не готов | |
| Notification flow работи (jobs → worker → logs) | ☐ Готов ☐ Не готов | |
| Няма Blocker бъгове | ☐ Готов ☐ Не готов | |
| Всички Critical бъгове са fixed и retest-нати | ☐ Готов ☐ Не готов | |

### 5.3 Заключение

> **Дата:** [Да се попълни]  
> **Подготвил:** Plamen Ch.

#### Обобщение:

```
[Да се попълни след изпълнение на всички тестове]

Пример:
- Общо тестове: 21
- Pass: 18
- Fail: 2
- Blocked: 1

Блокери:
- BUG-001: [описание] — Owner: [име] — Статус: [Open/Fixed]

Критични:
- BUG-003: [описание] — Owner: [име] — Статус: [Open/Fixed]

Заключение:
☐ Проектът Е ГОТОВ за demo
☐ Проектът НЕ Е ГОТОВ за demo — блокиращи проблеми:
  1. 
  2. 
```

### 5.4 Препоръки преди Demo

1. [ ] Проверка на staging средата
2. [ ] Тестови акаунти са създадени и работят
3. [ ] Seed данните са коректни
4. [ ] Worker-ът за нотификации е пуснат
5. [ ] Базата данни е чиста (без тестови боклуци)
6. [ ] Backup план при fail на live demo

---

*Документът е създаден от Plamen Ch. като част от QA дейностите в Team Project.*
