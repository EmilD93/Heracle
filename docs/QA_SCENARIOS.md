# QA Scenarios - Registration & Waitlist Testing

**Project:** School Events & Notification Center  
**Role:** QA Tester  
**Focus:** Registration Flow, Waitlist Management, Promotion Logic  
**Status:** Initial Scenarios

---

## 📋 Test Scope

This document covers QA test scenarios for:
1. ✅ Student Registration (confirmed and waitlist)
2. ✅ Waitlist Management (position tracking, FIFO ordering)
3. ✅ Automatic Promotion (when capacity becomes available)
4. ✅ Error Handling (invalid inputs, edge cases)
5. ✅ Data Consistency (no duplicates, correct status tracking)

**Out of Scope:** Notification delivery (handled by worker team)

---

## 🧪 Test Scenarios

---

## **Category 1: Registration Flow - Happy Path**

### TC-REG-001: Student Successfully Registers for Available Event
**Objective:** Verify student can register when event has available capacity  
**Preconditions:**
- Event exists with capacity = 10
- Event is published
- Student is authenticated
- Student has not registered for this event

**Steps:**
1. Student clicks "Register" button
2. System processes registration request
3. System confirms registration

**Expected Result:**
- ✅ HTTP 201 Created
- ✅ Registration status = `CONFIRMED`
- ✅ No waitlist position assigned
- ✅ Confirmation notification sent
- ✅ Event capacity decreases by 1

**Test Data:**
- Event: "Python Workshop 101"
- Capacity: 10
- Current registrations: 5

---

### TC-REG-002: Student Joins Waitlist When Event is Full
**Objective:** Verify student joins waitlist when all seats are taken  
**Preconditions:**
- Event exists with capacity = 3
- Event is published
- 3 students already registered (CONFIRMED)
- Student is authenticated
- Student has not registered for this event

**Steps:**
1. Student clicks "Register" button
2. System detects no available capacity
3. System adds student to waitlist

**Expected Result:**
- ✅ HTTP 201 Created
- ✅ Registration status = `WAITLISTED`
- ✅ Waitlist position = 1
- ✅ Waitlist notification sent
- ✅ Event capacity unchanged

**Test Data:**
- Event: "Advanced Java Course"
- Capacity: 3
- Current confirmed: 3
- Waitlist position should be: 1

---

### TC-REG-003: Multiple Students on Waitlist Get Correct Positions
**Objective:** Verify FIFO waitlist ordering with multiple students  
**Preconditions:**
- Event exists with capacity = 2, already full
- Student A is on waitlist (position 1, registered at 14:00:00)
- Student B is on waitlist (position 2, registered at 14:00:05)
- Student C is ready to join waitlist

**Steps:**
1. Student C registers for the event
2. System adds C to waitlist

**Expected Result:**
- ✅ Student C: position = 3
- ✅ Student A: position = 1 (unchanged)
- ✅ Student B: position = 2 (unchanged)
- ✅ Positions are sequential: 1, 2, 3

**Test Data:**
- Event: "Data Science Bootcamp"
- Capacity: 2
- Confirmed: 2
- Waitlist: [A, B] → [A, B, C]

---

## **Category 2: Registration Flow - Error Cases**

### TC-REG-004: Student Cannot Register Twice for Same Event
**Objective:** Prevent duplicate registrations for same event  
**Preconditions:**
- Student A already registered (CONFIRMED) for Event X
- Student A tries to register again

**Steps:**
1. Student A clicks "Register" for Event X
2. System checks for existing registration

**Expected Result:**
- ✅ HTTP 409 Conflict
- ✅ Error message: "You are already registered for this event"
- ✅ No new registration created
- ✅ Existing registration unchanged

**Test Data:**
- Student: Alice (ID: S001)
- Event: "Machine Learning 301"
- Existing registration: CONFIRMED

---

### TC-REG-005: Unauthenticated User Cannot Register
**Objective:** Prevent registration without authentication  
**Preconditions:**
- User is not logged in
- Event exists and has available capacity

**Steps:**
1. User clicks "Register" without being authenticated
2. System checks authentication status

**Expected Result:**
- ✅ HTTP 401 Unauthorized
- ✅ Error message: "Please log in to register"
- ✅ No registration created
- ✅ Redirect to login page (UI concern)

---

### TC-REG-006: Registration Fails for Non-Existent Event
**Objective:** Validate event existence before registration  
**Preconditions:**
- Event ID does not exist in system
- Student is authenticated

**Steps:**
1. Student submits registration for event_id = "invalid-123"
2. System looks up event

**Expected Result:**
- ✅ HTTP 404 Not Found
- ✅ Error message: "Event not found"
- ✅ No registration created

**Test Data:**
- event_id: "invalid-123"

---

### TC-REG-007: Registration Fails for Unpublished Event
**Objective:** Students cannot register for draft events  
**Preconditions:**
- Event exists but status = `DRAFT`
- Student is authenticated

**Steps:**
1. Student tries to register for draft event
2. System checks event status

**Expected Result:**
- ✅ HTTP 403 Forbidden
- ✅ Error message: "Event is not yet published"
- ✅ No registration created

**Test Data:**
- Event: "Upcoming Workshop"
- Status: DRAFT

---

## **Category 3: Waitlist - FIFO Ordering**

### TC-WAIT-001: Waitlist Maintains FIFO Order
**Objective:** Verify FIFO order with multiple students joining over time  
**Preconditions:**
- Event capacity = 1
- Student A registered (CONFIRMED)

**Steps:**
1. At 10:00:00 - Student B registers → Waitlist position 1
2. At 10:00:30 - Student C registers → Waitlist position 2
3. At 10:01:00 - Student D registers → Waitlist position 3
4. Verify order via GET /api/events/{id}/waitlist

**Expected Result:**
- ✅ Waitlist order: [B (10:00:00), C (10:00:30), D (10:01:00)]
- ✅ No position gaps: 1, 2, 3
- ✅ Positions never reordered

**Test Data:**
- Event: "Exclusive Training"
- Capacity: 1
- Confirmed: 1

---

### TC-WAIT-002: Positions Update When Student Cancels from Middle of Waitlist
**Objective:** Verify position numbers adjust after cancellation  
**Preconditions:**
- Waitlist: [A (pos 1), B (pos 2), C (pos 3)]

**Steps:**
1. Student B cancels registration
2. Check updated waitlist

**Expected Result:**
- ✅ B is removed
- ✅ A: position 1 (unchanged)
- ✅ C: position 2 (was 3, now updated)
- ✅ No gap in positions: 1, 2

**Test Data:**
- Event: "Limited Seats Event"
- Capacity: 2
- Confirmed: 2
- Before cancel: [A (1), B (2), C (3)]
- After cancel: [A (1), C (2)]

---

### TC-WAIT-003: Get Waitlist Returns Students in FIFO Order
**Objective:** API returns waitlist in correct order  
**Preconditions:**
- Waitlist: [A (pos 1), B (pos 2), C (pos 3)]

**Steps:**
1. Send GET /api/events/{event_id}/waitlist
2. Verify response

**Expected Result:**
- ✅ HTTP 200 OK
- ✅ Response contains array of students
- ✅ Order in response: [A, B, C]
- ✅ Each student has position field

**Response Format:**
```json
{
  "event_id": "evt-001",
  "waitlist_count": 3,
  "students": [
    { "student_id": "S001", "name": "Alice", "position": 1, "joined_at": "2026-06-18T10:00:00Z" },
    { "student_id": "S002", "name": "Bob", "position": 2, "joined_at": "2026-06-18T10:00:30Z" },
    { "student_id": "S003", "name": "Charlie", "position": 3, "joined_at": "2026-06-18T10:01:00Z" }
  ]
}
```

---

## **Category 4: Promotion - Single Cancellation**

### TC-PROM-001: First Waitlisted Student Promoted on Cancellation
**Objective:** Verify FIFO promotion when confirmed student cancels  
**Preconditions:**
- Event capacity: 2
- Confirmed: [Student A, Student B]
- Waitlist: [Student C (pos 1), Student D (pos 2)]

**Steps:**
1. Student A cancels registration
2. System triggers promotion
3. Check Student C status
4. Check Student D position

**Expected Result:**
- ✅ Student C: status changed WAITLISTED → CONFIRMED
- ✅ Student C: position removed (set to NULL)
- ✅ Student D: position 2 → 1
- ✅ Confirmed registrations: [B, C]
- ✅ Waitlist: [D (pos 1)]
- ✅ Promotion notification sent to Student C

**Test Data:**
- Event: "Limited Event"
- Capacity: 2
- Before: Confirmed=[A, B], Waitlist=[C(1), D(2)]
- After: Confirmed=[B, C], Waitlist=[D(1)]

---

### TC-PROM-002: No Promotion When Waitlist is Empty
**Objective:** Handle cancellation gracefully when no waitlist exists  
**Preconditions:**
- Event capacity: 3
- Confirmed: [Student A, Student B]
- Waitlist: (empty)

**Steps:**
1. Student A cancels
2. System triggers promotion
3. Verify no errors

**Expected Result:**
- ✅ Student A: status = CANCELLED
- ✅ No promotions occur
- ✅ No errors logged
- ✅ Capacity remains 3, confirmed remains 1

---

### TC-PROM-003: Promotion Stops at Capacity
**Objective:** Don't promote more students than available capacity  
**Preconditions:**
- Event capacity: 2
- Confirmed: [Student A] (1/2 seats)
- Waitlist: [Student B (pos 1), Student C (pos 2), Student D (pos 3)]

**Steps:**
1. Student A cancels (frees 1 seat)
2. System triggers promotion

**Expected Result:**
- ✅ Only Student B promoted (1 seat available)
- ✅ Students C, D remain waitlisted
- ✅ C position: 2 → 1
- ✅ D position: 3 → 2
- ✅ Confirmed: [B]
- ✅ Waitlist: [C (pos 1), D (pos 2)]

**Test Data:**
- Event: "Small Event"
- Capacity: 2
- Before: Confirmed=[A], Waitlist=[B(1), C(2), D(3)]
- After: Confirmed=[B], Waitlist=[C(1), D(2)]

---

## **Category 5: Promotion - Multiple Cancellations**

### TC-PROM-004: Chain Promotion - Multiple Cancellations Trigger Multiple Promotions
**Objective:** Verify promotion chain with consecutive cancellations  
**Preconditions:**
- Event capacity: 2
- Confirmed: [Student A, Student B]
- Waitlist: [Student C (pos 1), Student D (pos 2)]

**Steps:**
1. Student A cancels
   - Promotion 1: C promoted
2. Student B cancels
   - Promotion 2: D promoted
3. Verify final state

**Expected Result:**
- ✅ After cancel A: Confirmed=[B, C], Waitlist=[D(1)]
- ✅ After cancel B: Confirmed=[C, D], Waitlist=[]
- ✅ Two promotion events published
- ✅ Both C and D received promotion notifications

**Test Data:**
- Event: "Popular Event"
- Capacity: 2
- Sequence:
  - Initial: Confirmed=[A, B], Waitlist=[C(1), D(2)]
  - After A cancels: Confirmed=[B, C], Waitlist=[D(1)]
  - After B cancels: Confirmed=[C, D], Waitlist=[]

---

### TC-PROM-005: Rapid Concurrent Cancellations
**Objective:** Handle race condition with near-simultaneous cancellations  
**Preconditions:**
- Event capacity: 3
- Confirmed: [A, B, C]
- Waitlist: [D (pos 1), E (pos 2), F (pos 3), G (pos 4)]

**Steps:**
1. Send cancellation requests from A, B, C simultaneously
2. Wait for all promotions to complete
3. Check final state

**Expected Result:**
- ✅ Final confirmed: [D, E, F] (no duplicates)
- ✅ Final waitlist: [G (pos 1)]
- ✅ No database corruption
- ✅ Positions are sequential
- ✅ All promotions logged in audit trail

**Note:** This tests database lock mechanism (SERIALIZABLE transaction)

---

## **Category 6: Registration Cancellation**

### TC-CANCEL-001: Student Successfully Cancels Confirmed Registration
**Objective:** Verify cancellation removes student from confirmed registrations  
**Preconditions:**
- Student A has CONFIRMED registration for Event X
- Event is published

**Steps:**
1. Student A requests cancellation
2. System processes request
3. Verify status change

**Expected Result:**
- ✅ HTTP 204 No Content
- ✅ Registration status: CONFIRMED → CANCELLED
- ✅ Registration removed from confirmed list
- ✅ Cancellation notification sent
- ✅ Promotion triggered (if waitlist exists)

---

### TC-CANCEL-002: Cannot Cancel Already Cancelled Registration
**Objective:** Prevent duplicate cancellations  
**Preconditions:**
- Registration already has status = CANCELLED

**Steps:**
1. Student tries to cancel again
2. System checks status

**Expected Result:**
- ✅ HTTP 400 Bad Request
- ✅ Error message: "Registration is already cancelled"
- ✅ No duplicate cancellation

---

### TC-CANCEL-003: Cannot Cancel Waitlisted Registration
**Objective:** Decide policy: can students cancel from waitlist?  
**Preconditions:**
- Student A has WAITLISTED registration
- System allows cancelling from waitlist

**Steps:**
1. Student A requests cancellation while waitlisted
2. System processes request

**Expected Result:**
- ✅ HTTP 204 No Content
- ✅ Registration status: WAITLISTED → CANCELLED
- ✅ Waitlist positions of subsequent students shift down
- ✅ No promotion triggered (cancelling from waitlist frees no confirmed seats)

**Example:**
- Before: Waitlist=[A(1), B(2), C(3)]
- A cancels
- After: Waitlist=[B(1), C(2)]

---

## **Category 7: Data Consistency & Validation**

### TC-DATA-001: No Duplicate Active Registrations
**Objective:** Ensure same student cannot have 2 active registrations per event  
**Preconditions:**
- Student A has CONFIRMED registration for Event X
- Attempt to create another registration for same event

**Steps:**
1. Query database for student A's registrations on Event X
2. Count active (non-cancelled) registrations

**Expected Result:**
- ✅ Only 1 active registration exists
- ✅ Duplicate prevention works at API level
- ✅ Duplicate prevention works at database level (unique constraint)

---

### TC-DATA-002: Confirmed Count Matches Capacity Limit
**Objective:** Verify confirmed registrations never exceed event capacity  
**Preconditions:**
- Event capacity = 10

**Steps:**
1. Register students up to capacity
2. Attempt 11th registration
3. Verify counts

**Expected Result:**
- ✅ 10 students: CONFIRMED
- ✅ 11th student: WAITLISTED (not CONFIRMED)
- ✅ confirmed_count ≤ capacity always holds

---

### TC-DATA-003: Waitlist Position Numbers Are Sequential
**Objective:** Verify no gaps in waitlist positions (1, 2, 3... not 1, 2, 4)  
**Preconditions:**
- Waitlist with students

**Steps:**
1. Query all waitlisted students
2. Check position sequence

**Expected Result:**
- ✅ Positions: 1, 2, 3, 4, 5... (no gaps)
- ✅ No position duplicates
- ✅ Highest position = waitlist count

**Example:**
- ✅ Correct: [1, 2, 3, 4]
- ❌ Wrong: [1, 2, 4] (gap at 3)
- ❌ Wrong: [1, 1, 2] (duplicate 1)

---

### TC-DATA-004: Timestamps Are in UTC
**Objective:** Ensure all timestamps use consistent timezone (UTC)  
**Preconditions:**
- Student registers at various times

**Steps:**
1. Check timestamp format
2. Verify timezone

**Expected Result:**
- ✅ All timestamps in ISO 8601 format: "2026-06-18T14:30:00Z"
- ✅ All timestamps in UTC (Z suffix)
- ✅ No local timezone used

---

## **Category 8: API Response Validation**

### TC-API-001: Registration Response Contains Required Fields
**Objective:** Verify POST /api/events/{event_id}/register response structure  
**Preconditions:**
- Valid registration request

**Steps:**
1. Submit registration
2. Parse response JSON

**Expected Result:**
- ✅ HTTP 201 Created
- ✅ Response contains:
  - `registration_id` (UUID)
  - `event_id` (string)
  - `student_id` (string)
  - `status` (CONFIRMED or WAITLISTED)
  - `position` (int, only if WAITLISTED)
  - `created_at` (ISO 8601 timestamp)

**Response Format (CONFIRMED):**
```json
{
  "registration_id": "reg-abc-123",
  "event_id": "evt-001",
  "student_id": "S001",
  "status": "confirmed",
  "created_at": "2026-06-18T14:30:00Z"
}
```

**Response Format (WAITLISTED):**
```json
{
  "registration_id": "reg-def-456",
  "event_id": "evt-001",
  "student_id": "S002",
  "status": "waitlisted",
  "position": 1,
  "created_at": "2026-06-18T14:30:30Z"
}
```

---

### TC-API-002: Waitlist Response Includes All Required Fields
**Objective:** Verify GET /api/events/{event_id}/waitlist response structure  
**Preconditions:**
- Event has waitlisted students

**Steps:**
1. Send GET request
2. Parse response

**Expected Result:**
- ✅ HTTP 200 OK
- ✅ Response contains array of students
- ✅ Each student has: student_id, name, position, joined_at

---

## **Category 9: Stress & Performance Testing**

### TC-PERF-001: Handle Large Waitlist (1000+ students)
**Objective:** Verify system performs with large waitlist  
**Preconditions:**
- Event capacity: 100
- Confirmed registrations: 100
- Waitlist: 1000 students

**Steps:**
1. Register 1000 more students
2. Measure response time
3. Trigger promotion of 100 students

**Expected Result:**
- ✅ Registration response time: < 500ms
- ✅ Promotion completes: < 2 seconds
- ✅ No timeout errors
- ✅ All positions assigned correctly

---

### TC-PERF-002: Handle Rapid Cancellations
**Objective:** Verify system handles 100+ cancellations in short timeframe  
**Preconditions:**
- Event with 100 confirmed students
- 500 students on waitlist

**Steps:**
1. Send 100 cancellation requests in parallel
2. Measure completion time
3. Verify final state

**Expected Result:**
- ✅ All cancellations complete successfully
- ✅ 100 students promoted from waitlist
- ✅ No race condition errors
- ✅ Positions remain sequential
- ✅ Total time: < 5 seconds

---

## **Category 10: Integration Testing**

### TC-INT-001: End-to-End Registration → Promotion Flow
**Objective:** Test complete flow from registration through promotion  
**Preconditions:**
- Event created and published
- Capacity: 2

**Steps:**
1. Student A registers → CONFIRMED
2. Student B registers → CONFIRMED
3. Student C registers → WAITLISTED (position 1)
4. Student D registers → WAITLISTED (position 2)
5. Student A cancels
6. Verify Student C promoted

**Expected Result:**
- ✅ Step 1-2: Both CONFIRMED
- ✅ Step 3-4: Both WAITLISTED with correct positions
- ✅ Step 5: Cancellation succeeds
- ✅ Step 6: Student C → CONFIRMED, Student D → position 1
- ✅ Event queue receives all events
- ✅ Notification worker can process events

---

## 📊 Test Summary Table

| Category | Test Count | Status |
|----------|-----------|--------|
| Registration - Happy Path | 3 | ⏳ Ready |
| Registration - Error Cases | 4 | ⏳ Ready |
| Waitlist - FIFO | 3 | ⏳ Ready |
| Promotion - Single | 3 | ⏳ Ready |
| Promotion - Multiple | 2 | ⏳ Ready |
| Cancellation | 3 | ⏳ Ready |
| Data Consistency | 4 | ⏳ Ready |
| API Response | 2 | ⏳ Ready |
| Performance | 2 | ⏳ Ready |
| Integration | 1 | ⏳ Ready |
| **Total** | **27** | ⏳ Ready |

---

## 🚀 Execution Guidelines

### Test Environment Setup
- Use test database (separate from production)
- Clear all data before each test run
- Use UTC timezone for all operations

### Test Data Requirements
- Create test users (Students)
- Create test events with various capacities
- Use realistic event names and data

### Pass/Fail Criteria
- **PASS:** All expected results met, no errors
- **FAIL:** Any expected result not met, or unexpected error
- **BLOCK:** Test cannot run (env issue, missing data)

### Bug Reporting
Include in bug report:
- Test case ID (e.g., TC-REG-001)
- Steps to reproduce
- Expected vs actual result
- Error logs/screenshots
- Environment details (Python version, database, etc.)

---

## 📝 Test Execution Tracking

After running each test, update status:
- ⏳ Not Started
- 🔄 In Progress
- ✅ Passed
- ❌ Failed
- ⏸️ Blocked

