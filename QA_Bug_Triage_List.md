# Bug Triage List

> **Action Item:** Create Bug Triage List  
> **Owner:** Plamen Ch.  
> **Priority:** MEDIUM  
> **Due Date:** Today 21:00  
> **Status:** In Progress  
> **Дата на създаване:** 30 юни 2026

---

## 📋 Severity Definitions

| Ниво | Описание | Критерий |
|------|----------|----------|
| **Blocker** | Demo flow не може да продължи | Не може да се логне, създаде event, регистрира student или изпрати нотификация |
| **Critical** | Основна функция не работи | Login/Register/Event CRUD/Registration не работят коректно |
| **Major** | Работи, но грешно | Валидация пропуска грешни данни, грешни статуси, объркани полета |
| **Minor** | UI / Cosmetic | Неправилно подравняване, typo, липсващ hover, цветове |

---

## 1. Bug List

### 1.1 Blocker Bugs

| Bug ID | Title | Severity | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|----------|-------|--------|-------|----------|--------|------|
| BUG-001 | | Blocker | | New | | | | |
| BUG-002 | | Blocker | | New | | | | |
| BUG-003 | | Blocker | | New | | | | |

### 1.2 Critical Bugs

| Bug ID | Title | Severity | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|----------|-------|--------|-------|----------|--------|------|
| BUG-004 | | Critical | | New | | | | |
| BUG-005 | | Critical | | New | | | | |
| BUG-006 | | Critical | | New | | | | |

### 1.3 Major Bugs

| Bug ID | Title | Severity | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|----------|-------|--------|-------|----------|--------|------|
| BUG-007 | | Major | | New | | | | |
| BUG-008 | | Major | | New | | | | |
| BUG-009 | | Major | | New | | | | |

### 1.4 Minor Bugs

| Bug ID | Title | Severity | Owner | Status | Steps | Expected | Actual | Дата |
|--------|-------|----------|-------|--------|-------|----------|--------|------|
| BUG-010 | | Minor | | New | | | | |
| BUG-011 | | Minor | | New | | | | |
| BUG-012 | | Minor | | New | | | | |

---

## 2. Bug Report Template

> Използвай този template за всяко ново бъгче. Копирай го в GitHub Issue или Discord.

```
═══════════════════════════════════════════════════════════════
                    BUG REPORT
═══════════════════════════════════════════════════════════════

[1] BUG ID:          BUG-[###]
[2] Title:            [Кратко, ясно описание]
[3] Severity:         Blocker / Critical / Major / Minor
[4] Priority:          P1 / P2 / P3 / P4
[5] Owner:            [Георги / Калоян / Павел / Пламен / Валери]
[6] Status:           New / In Progress / Fixed / Reopened / Closed
[7] Дата:             [ДД/ММ/ГГГГ HH:MM]

───────────────────────────────────────────────────────────────
[8] STEPS TO REPRODUCE
───────────────────────────────────────────────────────────────
1. 
2. 
3. 

───────────────────────────────────────────────────────────────
[9] EXPECTED RESULT
───────────────────────────────────────────────────────────────

───────────────────────────────────────────────────────────────
[10] ACTUAL RESULT
───────────────────────────────────────────────────────────────

───────────────────────────────────────────────────────────────
[11] ENVIRONMENT
───────────────────────────────────────────────────────────────
- Браузър/Версия: 
- OS: 
- Среда: Staging / Production
- Build: 

───────────────────────────────────────────────────────────────
[12] SCREENSHOTS / VIDEOS / LOGS
───────────────────────────────────────────────────────────────

───────────────────────────────────────────────────────────────
[13] ADDITIONAL NOTES
───────────────────────────────────────────────────────────────
[Console errors, network requests, response codes]

═══════════════════════════════════════════════════════════════
```

---

## 3. Triage Summary

### 3.1 Обобщение

| Severity | Брой | Fixed | In Progress | New |
|----------|------|-------|-------------|-----|
| Blocker | | | | |
| Critical | | | | |
| Major | | | | |
| Minor | | | | |
| **ОБЩО** | | | | |

### 3.2 По Owner

| Owner | Blocker | Critical | Major | Minor | ОБЩО |
|-------|---------|----------|-------|-------|------|
| Георги | | | | | |
| Калоян | | | | | |
| Павел | | | | | |
| Пламен | | | | | |
| Валери | | | | | |

### 3.3 Acceptance Criteria

- ✅ Всички намерени проблеми до 21:00 са записани
- ✅ Всеки проблем има owner (Георги / Калоян / Павел / Пламен / Валери)
- ✅ Всеки проблем има Severity (Blocker / Critical / Major / Minor)
- ✅ Всеки проблем има Status (New / In Progress / Fixed)

---

## 4. Quick Add — Discord / GitHub Issues Format

> Копирай този формат за бързо добавяне в Discord или GitHub Issues.

```
**Bug ID:** BUG-[###]
**Title:** [Кратко описание]
**Severity:** [Blocker/Critical/Major/Minor]
**Owner:** [@username]
**Status:** New
**Steps:**
1. 
2. 
3. 
**Expected:** 
**Actual:** 
```

---

*Документът е създаден от Plamen Ch. като част от QA дейностите в Team Project.*
