# Promotion Logic - Detailed Documentation

**Technology Stack:** Python  
**Status:** Design Phase  
**Related Document:** [REGISTRATION_WAITLIST_FLOW.md](REGISTRATION_WAITLIST_FLOW.md)

---

## 📌 Overview

The **Promotion Logic** is the core mechanism that automatically moves waitlisted students to confirmed registration when capacity becomes available. This document defines the exact rules, edge cases, and implementation details.

---

## 🎯 Promotion Triggers

Promotion occurs **ONLY** when:

| Trigger | Condition | Result |
|---------|-----------|--------|
| **Registration Cancellation** | Student cancels confirmed registration | Frees up one seat; check waitlist |
| **Event Capacity Increase** | Organizer increases event capacity | Frees up seats; check waitlist |
| **Admin Override** | Admin manually increases capacity | Frees up seats; check waitlist |

**NOT Triggered By:**
- ❌ Student declining promotion (doesn't cancel registration)
- ❌ Student joining waitlist (doesn't free seats)
- ❌ Event creation or publication

---

## 🔄 Promotion Algorithm

### Core Logic Flow

```python
def promote_waitlisted_students(event_id: str):
    """
    Promote waitlisted students to confirmed when seats become available.
    FIFO order - oldest waitlist entry first.
    """
    
    # Step 1: Get event details
    event = get_event(event_id)
    
    # Step 2: Calculate available seats
    confirmed_count = count_confirmed_registrations(event_id)
    available_seats = event.capacity - confirmed_count
    
    # Step 3: Get waitlisted students (ordered by timestamp, oldest first)
    waitlist = get_waitlist(event_id, order_by="created_at ASC", limit=available_seats)
    
    # Step 4: Promote each waitlisted student
    for registration in waitlist:
        # 4a: Update status to CONFIRMED
        registration.status = RegistrationStatus.CONFIRMED
        registration.position = None  # Remove waitlist position
        registration.updated_at = datetime.utcnow()
        save_registration(registration)
        
        # 4b: Publish promotion event for notification worker
        publish_event({
            "type": "waitlist.promoted",
            "student_id": registration.student_id,
            "event_id": event_id,
            "registration_id": registration.id,
            "previous_position": registration.position,
            "timestamp": datetime.utcnow()
        })
    
    # Step 5: Return promotion results
    return {
        "promoted_count": len(waitlist),
        "remaining_waitlist": count_waitlisted_registrations(event_id),
        "available_seats": available_seats - len(waitlist)
    }
```

---

## 🚨 Edge Cases & Handling

### Edge Case 1: Multiple Cancellations in Quick Succession

**Scenario:** 3 students cancel registrations within 5 seconds

**Expected Behavior:**
- Each cancellation triggers promotion independently
- Promotions execute sequentially (not parallel)
- Each promotion event is published separately

**Implementation:**
```python
def cancel_registration(registration_id: str) -> dict:
    """
    Cancel a registration and trigger promotion.
    """
    registration = get_registration(registration_id)
    
    if registration.status != RegistrationStatus.CONFIRMED:
        raise ValidationError("Cannot cancel non-confirmed registration")
    
    # Step 1: Update registration status
    registration.status = RegistrationStatus.CANCELLED
    registration.updated_at = datetime.utcnow()
    save_registration(registration)
    
    # Step 2: Publish cancellation event
    publish_event({
        "type": "registration.cancelled",
        "student_id": registration.student_id,
        "event_id": registration.event_id,
        "registration_id": registration.id,
        "timestamp": datetime.utcnow()
    })
    
    # Step 3: Promote waitlisted students (CRITICAL SECTION)
    promotion_result = promote_waitlisted_students(registration.event_id)
    
    return {
        "status": "cancelled",
        "promotions": promotion_result["promoted_count"]
    }
```

---

### Edge Case 2: Insufficient Waitlist for Available Seats

**Scenario:** Event capacity increases from 10 to 50 (40 new seats), but only 5 students on waitlist

**Expected Behavior:**
- All 5 waitlisted students are promoted
- 35 seats remain empty
- No errors thrown

**Implementation:**
```python
# Algorithm handles this automatically
available_seats = 40
waitlist_count = 5

# The LIMIT in SQL query restricts promotion to available seats
waitlist = get_waitlist(event_id, limit=available_seats)  # Returns 5 students
# Only 5 students promoted, no error
```

---

### Edge Case 3: No Waitlist Students

**Scenario:** Registration cancelled, but no waitlist exists

**Expected Behavior:**
- Promotion function executes
- Returns 0 promotions
- No errors

**Implementation:**
```python
# Algorithm handles this gracefully
waitlist = get_waitlist(event_id, limit=available_seats)  # Returns empty list
for registration in waitlist:  # Loop never executes
    # ...
return {"promoted_count": 0}
```

---

### Edge Case 4: Concurrent Promotions

**Scenario:** Two cancellations trigger promotion simultaneously (race condition)

**Problem:** Without locking, both might promote the same student

**Solution: Database-Level Locking**
```python
def promote_waitlisted_students(event_id: str):
    """
    Use database transactions to prevent race conditions.
    """
    with db.transaction(isolation_level="SERIALIZABLE"):
        # Lock the waitlist records
        waitlist = db.execute("""
            SELECT * FROM registrations 
            WHERE event_id = %s AND status = 'waitlisted'
            ORDER BY created_at ASC
            LIMIT %s
            FOR UPDATE  -- Database lock
        """, (event_id, available_seats))
        
        # Promotion logic (safe from race conditions)
        for registration in waitlist:
            # ... promotion code ...
```

---

### Edge Case 5: Student Promotes, then Cancels

**Scenario:** Student A is promoted, then cancels before accepting

**Expected Behavior:**
- Student A's registration changed to CANCELLED
- Promotion continues with next waitlist student

**Implementation:**
```python
# This is handled by the cancel_registration function
# which triggers promote_waitlisted_students again
# The promoted student's CANCELLED registration doesn't affect the process
# because we only promote WAITLISTED students, not CANCELLED ones
```

---

## 📊 Data Consistency Rules

| Rule | Constraint |
|------|-----------|
| **Status Transition** | WAITLISTED → CONFIRMED (only valid transition) |
| **Position Field** | Only set when status = WAITLISTED; NULL when status = CONFIRMED |
| **Ordering** | Promotion always FIFO by `created_at` timestamp |
| **No Duplicates** | Same student cannot have 2 active registrations for same event |
| **Capacity Integrity** | confirmed_count + available_seats ≤ total_capacity |

---

## ⚠️ Error Handling

```python
class PromotionError(Exception):
    """Base exception for promotion errors"""
    pass

class InsufficientCapacityError(PromotionError):
    """Event capacity is 0 or negative"""
    pass

class DatabaseLockError(PromotionError):
    """Failed to acquire database lock"""
    pass

class InvalidEventError(PromotionError):
    """Event not found or invalid"""
    pass

def promote_waitlisted_students(event_id: str) -> dict:
    try:
        # ... promotion logic ...
    except InsufficientCapacityError as e:
        logger.error(f"Promotion failed: insufficient capacity for event {event_id}")
        raise
    except DatabaseLockError as e:
        logger.error(f"Promotion failed: database lock timeout for event {event_id}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error during promotion: {str(e)}")
        raise PromotionError(f"Promotion failed: {str(e)}")
```

---

## 🔍 Promotion Verification

### Verify Promotion Completed Successfully

```python
def verify_promotion(event_id: str) -> bool:
    """
    Verify that promotion logic completed correctly.
    """
    event = get_event(event_id)
    confirmed = count_confirmed_registrations(event_id)
    waitlisted = count_waitlisted_registrations(event_id)
    
    # Check 1: Confirmed count does not exceed capacity
    if confirmed > event.capacity:
        logger.error("Data integrity error: confirmed > capacity")
        return False
    
    # Check 2: All waitlist positions are sequential (1, 2, 3...)
    positions = db.execute("""
        SELECT position FROM registrations
        WHERE event_id = %s AND status = 'waitlisted'
        ORDER BY position
    """, (event_id,))
    
    for idx, (pos,) in enumerate(positions, 1):
        if pos != idx:
            logger.error(f"Data integrity error: non-sequential position {pos} at index {idx}")
            return False
    
    # Check 3: Promoted students have correct transition timestamps
    # (implementation depends on audit log)
    
    return True
```

---

## 📈 Performance Considerations

| Scenario | Complexity | Concern | Solution |
|----------|-----------|---------|----------|
| Large waitlist (10k+) | O(n) | Bulk promotion slow | Batch process in chunks |
| Frequent cancellations | O(n) per cancellation | High load | Queue promotion as async task |
| Large event capacity | O(1) | Negligible | No issue |
| Database lock contention | Blocking | Concurrent cancellations bottleneck | SERIALIZABLE + timeout |

---

## 🔐 Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **Unauthorized Promotion** | Only system/worker can trigger; audit all promotions |
| **Data Tampering** | Database constraints prevent position manipulation |
| **Race Conditions** | SERIALIZABLE transaction isolation |
| **Notification Injection** | Validate event structure before publishing |

---

## 📝 Audit & Logging

Every promotion must be logged:

```python
def log_promotion(event_id: str, registration_id: str, previous_position: int):
    """
    Log promotion for audit trail.
    """
    audit_log({
        "action": "PROMOTION",
        "event_id": event_id,
        "registration_id": registration_id,
        "previous_position": previous_position,
        "promoted_at": datetime.utcnow(),
        "user": "SYSTEM",
        "status": "SUCCESS"
    })
```

---

## 🎓 Example Walkthrough

### Scenario: Event with Capacity 2

```
Initial State:
- Event capacity: 2
- Confirmed registrations: 2 (Student A, Student B)
- Waitlist: [Student C (pos 1), Student D (pos 2), Student E (pos 3)]

Step 1: Student A cancels
  → Seats freed: 1
  → Promotion triggered
  
  Action: Promote Student C (oldest, pos 1)
    - Student C: WAITLISTED → CONFIRMED
    - Student D: position 2 → position 1
    - Student E: position 3 → position 2
  
  Remaining:
  - Confirmed: 2 (Student B, Student C) [FULL]
  - Waitlist: [Student D (pos 1), Student E (pos 2)]

Step 2: Student B cancels
  → Seats freed: 1
  → Promotion triggered
  
  Action: Promote Student D (oldest, pos 1)
    - Student D: WAITLISTED → CONFIRMED
    - Student E: position 2 → position 1
  
  Remaining:
  - Confirmed: 2 (Student C, Student D) [FULL]
  - Waitlist: [Student E (pos 1)]

Step 3: Student C cancels
  → Seats freed: 1
  → Promotion triggered
  
  Action: Promote Student E (oldest, pos 1)
    - Student E: WAITLISTED → CONFIRMED
  
  Remaining:
  - Confirmed: 2 (Student D, Student E) [FULL]
  - Waitlist: [] [EMPTY]
```

---

## 🚀 Implementation Checklist

- [ ] Database schema supports FIFO ordering (indexed `created_at`)
- [ ] Position field updated when status changes
- [ ] Promotion function is idempotent (safe to call multiple times)
- [ ] Database transactions use SERIALIZABLE isolation
- [ ] All promotion events are published to message queue
- [ ] Error handling covers all edge cases
- [ ] Audit logging implemented
- [ ] Performance tested with large datasets
- [ ] Unit tests cover all scenarios
- [ ] Integration tests verify end-to-end flow
