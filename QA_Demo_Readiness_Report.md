# QA Smoke Test — Demo Readiness Report

> **Priority:** Critical  
> **Action Item:** Smoke test на последния main (demo flow only)  
> **Owner:** Plamen Ch.  
> **Due:** 03 юли 2026 (до края на деня)  
> **Branch:** `main` (latest)  
> **Status:** ☐ In Progress ☐ Done

---

## 🎯 Scope

Само demo flow. **НЕ** се тестват странични features.

```
reset_db.py → Login organizer → Create event → Publish event
→ Login student → Student sees event → Student registers
→ notification_jobs row created → Run worker once
→ notification_logs success row created
```

---

## 🔧 Environment

| Component | Value |
|-----------|-------|
| Branch | `main` |
| Commit | `[hash to fill]` |
| Date/Time | `[to fill]` |
| DB | PostgreSQL (via docker-compose) |
| reset_db.py | `python reset_db.py` |
| Worker | `python worker.py` (run once) |
| Browser | Chrome latest |
| Tested by | Plamen Ch. |

---

## ✅ Smoke Test Results

### Step 1: reset_db.py

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 1.1 | `python reset_db.py` изпълнява се без грешки | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 1.2 | Базата данни е чиста (няма leftover тестови данни) | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 1.3 | Таблиците са създадени коректно (events, users, registrations, notification_jobs, notification_logs) | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 1 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 2: Login Organizer

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 2.1 | Organizer login страница се зарежда | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 2.2 | Вход с валиден organizer акаунт | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 2.3 | Response съдържа `token` или `access_token` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 2.4 | Response съдържа `user.role === "organizer"` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 2.5 | Пренасочва към Organizer Dashboard | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 2 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 3: Create Event

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 3.1 | "Create Event" бутон е видим и кликваем | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 3.2 | Формата се отваря с всички полета | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 3.3 | Попълва се: Title, Description, Start Time, Location, Category, Capacity | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 3.4 | Натиска се "Create" → HTTP 201 | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 3.5 | Response съдържа `event.id` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 3.6 | Event се записва в БД (таблица `events`) | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 3 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 4: Publish Event

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 4.1 | Organizer вижда създадения event в своя списък | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 4.2 | "Publish" бутон е видим | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 4.3 | Натиска се "Publish" → статус става "published" | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 4.4 | Event е видим в публичния списък (без login) | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 4 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 5: Login Student

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 5.1 | Student login страница се зарежда | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 5.2 | Вход с валиден student акаунт | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 5.3 | Response съдържа `token` или `access_token` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 5.4 | Response съдържа `user.role === "student"` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 5.5 | Пренасочва към Student Dashboard | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 5 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 6: Student Sees Event

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 6.1 | Student отвари Events страница | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 6.2 | Публикуваното event се вижда в списъка | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 6.3 | Event details се зареждат: title, description, start_time, location, category, capacity | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 6.4 | "Register" бутон е видим | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 6 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 7: Student Registers

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 7.1 | Student натиска "Register" | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 7.2 | HTTP 200/201 от `/api/registrations` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 7.3 | Response съдържа `status` (CONFIRMED или WAITLISTED) | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 7.4 | Response съдържа `registration_id` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 7.5 | Регистрацията се записва в БД (таблица `registrations`) | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 7 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 8: notification_jobs Row Created

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 8.1 | В таблица `notification_jobs` има нов ред | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 8.2 | `job_type` = "registration_notification" (или подобно) | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 8.3 | `status` = "pending" | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 8.4 | Редът е свързан с `registration_id` | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 8 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 9: Run Worker Once

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 9.1 | `python worker.py` стартира без грешки | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 9.2 | Worker намира pending job от таблицата | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 9.3 | Worker обработва job-а (вижда се в конзолен лог) | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 9.4 | Worker завършва без exception | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 9 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

### Step 10: notification_logs Success Row Created

| # | Check | Status | Error / Notes | Owner | Severity |
|---|-------|--------|---------------|-------|----------|
| 10.1 | В таблица `notification_logs` има нов ред | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 10.2 | `status` = "sent" / "delivered" / "success" | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 10.3 | Редът е свързан с `job_id` от `notification_jobs` | ☐ Pass ☐ Fail ☐ Blocked | | | |
| 10.4 | Timestamp е попълнен | ☐ Pass ☐ Fail ☐ Blocked | | | |

**Step 10 Summary:** ☐ Pass ☐ Fail ☐ Blocked

---

## 📊 Final Summary

### Overall Status

| Step | Name | Status | Blocker Owner |
|------|------|--------|---------------|
| 1 | reset_db.py | ☐ Pass ☐ Fail ☐ Blocked | |
| 2 | Login organizer | ☐ Pass ☐ Fail ☐ Blocked | |
| 3 | Create event | ☐ Pass ☐ Fail ☐ Blocked | |
| 4 | Publish event | ☐ Pass ☐ Fail ☐ Blocked | |
| 5 | Login student | ☐ Pass ☐ Fail ☐ Blocked | |
| 6 | Student sees event | ☐ Pass ☐ Fail ☐ Blocked | |
| 7 | Student registers | ☐ Pass ☐ Fail ☐ Blocked | |
| 8 | notification_jobs row created | ☐ Pass ☐ Fail ☐ Blocked | |
| 9 | Run worker once | ☐ Pass ☐ Fail ☐ Blocked | |
| 10 | notification_logs success row | ☐ Pass ☐ Fail ☐ Blocked | |

### Counts

| Status | Count |
|--------|-------|
| **PASS** | |
| **FAIL** | |
| **BLOCKED** | |
| **Total** | 10 |

### Blockers (if any)

| Step | Issue | Owner | Severity | Action Required |
|------|-------|-------|----------|-----------------|
| | | | Blocker | |
| | | | Blocker | |

---

## ✅ Done When

- [ ] Всички 10 стъпки са маркирани Pass / Fail / Blocked
- [ ] Всеки Blocker има Owner
- [ ] Този документ е попълнен и качен в GitHub

---

*Report by Plamen Ch. | Date: `[to fill after testing]`*
