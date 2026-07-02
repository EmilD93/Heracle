# API Contract Validation — Frontend vs Backend

> **Action Item:** Validate frontend/backend API contracts  
> **Owner:** Plamen Ch.  
> **Priority:** MEDIUM  
> **Due Date:** Today 21:00  
> **Status:** In Progress  
> **Дата на създаване:** 30 юни 2026

---

## 📋 Съдържание

1. [Login Response Contract](#1-login-response-contract)
2. [Event Response Contract](#2-event-response-contract)
3. [Registration Response Contract](#3-registration-response-contract)
4. [Несъответствия](#4-несъответствия)
5. [Резюме](#5-резюме)

---

## 1. Login Response Contract

### 1.1 Очаквани полета от Frontend

| Поле | Тип | Задължително | Описание |
|------|-----|--------------|----------|
| token / access_token | string | ✅ Да | JWT токен за авторизация |
| user | object | ✅ Да | Информация за потребителя |
| user.id | string/int | ✅ Да | Уникален идентификатор |
| user.email | string | ✅ Да | Имейл адрес |
| user.first_name | string | ✅ Да | Първо име |
| user.last_name | string | ✅ Да | Фамилия |
| user.role | string | ✅ Да | "organizer" или "student" |

### 1.2 Backend Response — Актуално

> **Endpoint:** `POST /api/auth/login`  
> **Дата на проверка:** [Да се попълни]

```json
{
  "[Да се попълни от Plamen]": "[Да се попълни]"
}
```

| Поле (Backend) | Тип | Налично | Съвпада с Frontend | Бележки |
|----------------|-----|---------|-------------------|---------|
| token | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| access_token | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user | object | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.email | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.first_name | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.last_name | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| user.role | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 1.3 Несъответствия — Login

| # | Поле | Проблем | Frontend очаква | Backend връща | Owner | Статус |
|---|------|---------|-----------------|---------------|-------|--------|
| 1 | | | | | | ☐ Open ☐ Fixed |
| 2 | | | | | | ☐ Open ☐ Fixed |

---

## 2. Event Response Contract

### 2.1 Очаквани полета от Frontend

| Поле | Тип | Задължително | Описание |
|------|-----|--------------|----------|
| id | string/int | ✅ Да | Уникален идентификатор на събитието |
| title | string | ✅ Да | Заглавие на събитието |
| description | string | ✅ Да | Описание |
| capacity | int | ✅ Да | Максимален брой участници |
| start_time | datetime | ✅ Да | Начална дата и час |
| location | string | ✅ Да | Място на провеждане |
| category | string | ✅ Да | Категория на събитието |
| status | string | ✅ Да | "draft" / "published" |
| organizer_id | string/int | ✅ Да | ID на организатора |
| created_at | datetime | ☐ Не | Дата на създаване |
| updated_at | datetime | ☐ Не | Дата на последна промяна |

### 2.2 Backend Response — Актуално

> **Endpoint:** `GET /api/events` / `GET /api/events/:id` / `POST /api/events`  
> **Дата на проверка:** [Да се попълни]

```json
{
  "[Да се попълни от Plamen]": "[Да се попълни]"
}
```

| Поле (Backend) | Тип | Налично | Съвпада с Frontend | Бележки |
|----------------|-----|---------|-------------------|---------|
| id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| title | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| description | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| capacity | int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| start_time | datetime | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| location | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| category | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| status | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| organizer_id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| created_at | datetime | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| updated_at | datetime | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 2.3 Несъответствия — Event

| # | Поле | Проблем | Frontend очаква | Backend връща | Owner | Статус |
|---|------|---------|-----------------|---------------|-------|--------|
| 1 | | | | | | ☐ Open ☐ Fixed |
| 2 | | | | | | ☐ Open ☐ Fixed |

---

## 3. Registration Response Contract

### 3.1 Очаквани полета от Frontend

| Поле | Тип | Задължително | Описание |
|------|-----|--------------|----------|
| registration_id | string/int | ✅ Да | Уникален идентификатор на регистрацията |
| status | string | ✅ Да | "CONFIRMED" / "WAITLISTED" / "CANCELLED" |
| position | int | ☐ Не | Позиция в waitlist (ако е WAITLISTED) |
| event_id | string/int | ✅ Да | ID на събитието |
| student_id | string/int | ✅ Да | ID на студента |
| registered_at | datetime | ✅ Да | Дата и час на регистрация |

### 3.2 Backend Response — Актуално

> **Endpoint:** `POST /api/registrations` / `GET /api/registrations/:id`  
> **Дата на проверка:** [Да се попълни]

```json
{
  "[Да се попълни от Plamen]": "[Да се попълни]"
}
```

| Поле (Backend) | Тип | Налично | Съвпада с Frontend | Бележки |
|----------------|-----|---------|-------------------|---------|
| registration_id / id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| status | string | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| position | int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| event_id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| student_id | string/int | ☐ Да ☐ Не | ☐ Да ☐ Не | |
| registered_at / created_at | datetime | ☐ Да ☐ Не | ☐ Да ☐ Не | |

### 3.3 Несъответствия — Registration

| # | Поле | Проблем | Frontend очаква | Backend връща | Owner | Статус |
|---|------|---------|-----------------|---------------|-------|--------|
| 1 | | | | | | ☐ Open ☐ Fixed |
| 2 | | | | | | ☐ Open ☐ Fixed |

---

## 4. Несъответствия

### 4.1 Обобщена таблица на всички несъответствия

| # | Endpoint | Поле | Проблем | Frontend очаква | Backend връща | Owner | Статус | Приоритет |
|---|----------|------|---------|-----------------|---------------|-------|--------|-----------|
| 1 | | | | | | | ☐ Open ☐ Fixed | |
| 2 | | | | | | | ☐ Open ☐ Fixed | |
| 3 | | | | | | | ☐ Open ☐ Fixed | |
| 4 | | | | | | | ☐ Open ☐ Fixed | |
| 5 | | | | | | | ☐ Open ☐ Fixed | |

### 4.2 Owners

| Име | Роля | Отговорност |
|-----|------|-------------|
| Георги | Backend | [Да се попълни] |
| Калоян | Backend / Frontend | [Да се попълни] |
| Павел | Frontend | [Да се попълни] |
| Пламен | QA | Валидация и документиране |
| Валери | Backend | [Да се попълни] |

---

## 5. Резюме

### 5.1 Статус на проверката

| Endpoint | Проверен | Несъответствия | Owner |
|----------|----------|----------------|-------|
| POST /api/auth/login | ☐ Да ☐ Не | | Plamen Ch. |
| GET /api/events | ☐ Да ☐ Не | | Plamen Ch. |
| POST /api/events | ☐ Да ☐ Не | | Plamen Ch. |
| POST /api/registrations | ☐ Да ☐ Не | | Plamen Ch. |

### 5.2 Acceptance Criteria

- ✅ Списък с несъответствия между frontend и backend
- ✅ За всяко несъответствие има owner: Георги / Калоян / Павел / Пламен / Валери

### 5.3 Следващи стъпки

1. [ ] Проверка на реалните responses от backend
2. [ ] Сравнение с frontend expectations
3. [ ] Документиране на несъответствията
4. [ ] Асайнване на owners
5. [ ] Проследяване на фиксовете

---

*Документът е създаден от Plamen Ch. като част от QA дейностите в Team Project.*
