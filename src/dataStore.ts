// ─── Persistent Data Store (localStorage) ─────────────────────────────────────
// This module manages all app data in localStorage so changes persist
// across sessions. When a real backend API is ready, swap these functions
// for fetch() calls — the component interfaces stay the same.

import { EVENTS as SEED_EVENTS } from './data/events'
import { API_BASE } from './config/api'
import { authHeaders } from './authStore'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventData {
  id: string
  title: string
  description: string
  date: string
  image: string
  capacity: number
  registered: number
  category: string
  status: 'Published' | 'Draft' | 'Cancelled'
  location: string
  organizer: {
    name: string
    email: string
    phone: string
    profilePhotoUrl?: string
  }
  agenda?: { time: string; activity: string }[]
  createdBy?: string // email of user who created it
}

export interface Registration {
  id: string
  userEmail: string
  eventId: string
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'
  position: number
  createdAt: string
}

export interface EventAttendee {
  registrationId: string
  userId: string
  fullName: string
  email: string
  profilePhotoUrl?: string
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED'
  position: number | null
  createdAt: string
}

export interface NotificationItem {
  id: string
  type: string
  status: string
  eventTitle?: string
  message?: string
  createdAt: string
  seenAt?: string | null
  scheduledFor: string
  completedAt?: string | null
}

export interface UserProfileData {
  id?: string
  email: string
  role: 'student' | 'organizer'
  fullName: string
  profilePhotoUrl?: string
  bio?: string
  phone?: string
}

// ─── Storage Keys ─────────────────────────────────────────────────────────────

const EVENTS_KEY = 'heracle_events'
const REGISTRATIONS_KEY = 'heracle_registrations'
const INITIALIZED_KEY = 'heracle_data_initialized'

// ─── Initialization ───────────────────────────────────────────────────────────

export function initializeDataStore() {
  if (localStorage.getItem(INITIALIZED_KEY)) return
  localStorage.setItem(EVENTS_KEY, JSON.stringify(SEED_EVENTS))
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify([]))
  localStorage.setItem(INITIALIZED_KEY, 'true')
}

// ─── Events CRUD ──────────────────────────────────────────────────────────────

// We still use localStorage as a cache, but we sync it with the backend.
// Returns true on success so callers can drive loading/error UI states.
export async function syncWithBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/events`)
    if (!res.ok) return false
    const events = await res.json()
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
    return true
  } catch (err) {
    console.error('Failed to sync events with backend', err)
    return false
  }
}

export function getAllEvents(): EventData[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getEventById(id: string | number): EventData | undefined {
  const events = getAllEvents()
  return events.find(e => String(e.id) === String(id))
}

export function getOrganizerEvents(userEmail: string): EventData[] {
  return getAllEvents().filter(e => e.organizer?.email === userEmail)
}

// Every mutation below resolves to this shape so the UI can always tell
// success from failure and show the real reason the API rejected the request
// (e.g. "Event capacity must be at least 1", "Title is required").
export interface ApiResult<T = undefined> {
  ok: boolean
  error?: string
  data?: T
}

async function readErrorDetail(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body?.detail === 'string') return body.detail
    if (Array.isArray(body?.detail) && body.detail[0]?.msg) return body.detail[0].msg
  } catch {
    // response wasn't JSON — fall through to the generic message
  }
  return fallback
}

export async function createEvent(event: Omit<EventData, 'id' | 'registered'>): Promise<ApiResult<EventData>> {
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not create event') }
    }
    const created = await res.json()
    await syncWithBackend()
    return { ok: true, data: { ...event, id: created.id ?? 'pending', registered: 0 } }
  } catch (err) {
    console.error('Failed to create event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function updateEvent(id: string, updates: Partial<EventData>): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not update event') }
    }
    await syncWithBackend()
    return { ok: true }
  } catch (err) {
    console.error('Failed to update event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

// Dedicated publish/cancel actions (POST /events/{id}/publish and /cancel).
// These map straight to the organizer dashboard's Publish/Cancel buttons.
export async function publishEvent(id: string): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/publish`, { method: 'POST' })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not publish event') }
    }
    await syncWithBackend()
    return { ok: true }
  } catch (err) {
    console.error('Failed to publish event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function cancelEvent(id: string): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}/cancel`, { method: 'POST' })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not cancel event') }
    }
    await syncWithBackend()
    return { ok: true }
  } catch (err) {
    console.error('Failed to cancel event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function getEventAttendees(eventId: string): Promise<ApiResult<EventAttendee[]>> {
  try {
    const res = await fetch(`${API_BASE}/registrations/event/${eventId}`)
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not load attendees') }
    }

    const data = await res.json()
    return { ok: true, data: data.items || [] }
  } catch (err) {
    console.error('Failed to fetch attendees', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export function deleteEvent(id: string) {
  const events = getAllEvents().filter(e => e.id !== id)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

// ─── Registrations ────────────────────────────────────────────────────────────

function getAllRegistrations(): Registration[] {
  try {
    const raw = localStorage.getItem(REGISTRATIONS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRegistrations(regs: Registration[]) {
  localStorage.setItem(REGISTRATIONS_KEY, JSON.stringify(regs))
}

export function getRegistrationsForUser(userEmail: string): Registration[] {
  return getAllRegistrations().filter(
    r => r.userEmail === userEmail && r.status !== 'CANCELLED'
  )
}

function upsertRegistrations(registrations: Registration[]) {
  const current = getAllRegistrations()
  const map = new Map<string, Registration>()
  for (const reg of current) map.set(reg.id, reg)
  for (const reg of registrations) map.set(reg.id, reg)
  saveRegistrations(Array.from(map.values()))
}

export function getRegistrationsForEvent(eventId: string): Registration[] {
  return getAllRegistrations().filter(
    r => r.eventId === eventId && r.status !== 'CANCELLED'
  )
}

export function getUserRegistrationForEvent(userEmail: string, eventId: string | number): Registration | undefined {
  return getAllRegistrations().find(
    r => r.userEmail === userEmail && String(r.eventId) === String(eventId) && r.status !== 'CANCELLED'
  )
}

export function cancelRegistration(userEmail: string, eventId: number) {
  const allRegs = getAllRegistrations()
  const idx = allRegs.findIndex(
    r => r.userEmail === userEmail && String(r.eventId) === String(eventId) && r.status !== 'CANCELLED'
  )
  if (idx === -1) return

  const wasConfirmed = allRegs[idx].status === 'CONFIRMED'
  allRegs[idx].status = 'CANCELLED'

  if (wasConfirmed) {
    const waitlisted = allRegs
      .filter(r => String(r.eventId) === String(eventId) && r.status === 'WAITLISTED')
      .sort((a, b) => a.position - b.position)

    if (waitlisted.length > 0) {
      const promoted = allRegs.findIndex(r => r.id === waitlisted[0].id)
      if (promoted !== -1) {
        allRegs[promoted].status = 'CONFIRMED'
      }
    } else {
      const event = getEventById(eventId)
      if (event) {
        updateEvent(String(eventId), { registered: Math.max(0, event.registered - 1) })
      }
    }
  }

  saveRegistrations(allRegs)
}

export async function registerForEvent(_userEmail: string, eventId: string | number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/registrations/${eventId}/register`, {
      method: 'POST',
      headers: authHeaders()
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.detail || 'Failed to register' }

    // Save to local cache so it persists on refresh
    upsertRegistrations([data.registration])

    // Sync events to get updated capacity
    await syncWithBackend()

    return data
  } catch (err) {
    console.error('Failed to register', err)
    return { ok: false, error: 'Network error' }
  }
}

export async function fetchUserRegistrationForEvent(userEmail: string, eventId: string | number): Promise<ApiResult<Registration | null>> {
  try {
    const res = await fetch(`${API_BASE}/registrations/event/${eventId}/user/${encodeURIComponent(userEmail)}`)
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not load registration') }
    }
    const data = await res.json()
    const registration = data.registration ?? null
    if (registration) upsertRegistrations([registration])
    return { ok: true, data: registration }
  } catch (err) {
    console.error('Failed to fetch user registration for event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function unregisterFromEvent(userEmail: string, eventId: string | number): Promise<ApiResult> {
  try {
    const res = await fetch(`${API_BASE}/registrations/${eventId}/unregister`, {
      method: 'DELETE',
      headers: authHeaders()
    })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not unregister from event') }
    }

    const all = getAllRegistrations().map(r => {
      if (String(r.eventId) === String(eventId) && r.userEmail === userEmail && r.status !== 'CANCELLED') {
        return { ...r, status: 'CANCELLED' as const }
      }
      return r
    })
    saveRegistrations(all)
    await syncWithBackend()
    return { ok: true }
  } catch (err) {
    console.error('Failed to unregister from event', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function kickRegistration(registrationId: string, organizerEmail: string): Promise<ApiResult> {
  try {
    let res = await fetch(`${API_BASE}/registrations/${registrationId}/kick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizerEmail }),
    })
    if (!res.ok && res.status !== 404 && res.status !== 405) {
      return { ok: false, error: await readErrorDetail(res, 'Could not remove attendee') }
    }
    if (!res.ok) {
      res = await fetch(`${API_BASE}/registrations/${registrationId}/kick`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizerEmail }),
      })
    }
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not remove attendee') }
    }

    const all = getAllRegistrations().map(r =>
      String(r.id) === String(registrationId) ? { ...r, status: 'CANCELLED' as const } : r,
    )
    saveRegistrations(all)
    await syncWithBackend()
    return { ok: true }
  } catch (err) {
    console.error('Failed to kick registration', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function syncRegistrationsForUser(userEmail: string): Promise<ApiResult<Registration[]>> {
  try {
    const res = await fetch(`${API_BASE}/registrations/user/${encodeURIComponent(userEmail)}`)
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not load registrations') }
    }
    const data = await res.json()
    const items: Registration[] = data.items || []
    upsertRegistrations(items)
    return { ok: true, data: items }
  } catch (err) {
    console.error('Failed to sync user registrations', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function getUserNotifications(userEmail: string): Promise<ApiResult<NotificationItem[]>> {
  try {
    const res = await fetch(`${API_BASE}/registrations/notifications/${encodeURIComponent(userEmail)}`)
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not load notifications') }
    }
    const data = await res.json()
    return { ok: true, data: data.items || [] }
  } catch (err) {
    console.error('Failed to fetch notifications', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function markUserNotificationsSeen(userEmail: string): Promise<ApiResult<{ markedCount: number }>> {
  try {
    const res = await fetch(`${API_BASE}/registrations/notifications/${encodeURIComponent(userEmail)}/seen`, {
      method: 'POST',
    })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not mark notifications as seen') }
    }
    const data = await res.json()
    return { ok: true, data: { markedCount: Number(data.markedCount || 0) } }
  } catch (err) {
    console.error('Failed to mark notifications as seen', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function getUserProfile(email: string): Promise<ApiResult<UserProfileData>> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile/${encodeURIComponent(email)}`)
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not load profile') }
    }
    const data = await res.json()
    return { ok: true, data: data.user }
  } catch (err) {
    console.error('Failed to fetch profile', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

export async function updateUserProfile(email: string, profile: Partial<UserProfileData>): Promise<ApiResult<UserProfileData>> {
  try {
    const res = await fetch(`${API_BASE}/auth/profile/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    })
    if (!res.ok) {
      return { ok: false, error: await readErrorDetail(res, 'Could not update profile') }
    }
    const data = await res.json()
    return { ok: true, data: data.user }
  } catch (err) {
    console.error('Failed to update profile', err)
    return { ok: false, error: 'Network error — could not reach the server' }
  }
}

// ─── Helper: Get "My Events" enriched data ────────────────────────────────────

export interface MyEventEnriched {
  id: string
  title: string
  category: string
  date: string
  time: string
  location: string
  image: string
  status: 'upcoming' | 'waitlisted' | 'past'
  ticketCode: string
  position: number | undefined
}

export function getMyEvents(userEmail: string): MyEventEnriched[] {
  const regs = getRegistrationsForUser(userEmail)
  const events = getAllEvents()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return regs.map(reg => {
    const event = events.find(e => String(e.id) === String(reg.eventId))
    if (!event) return null

    // Parse the event date
    const datePart = event.date.split('•')[0].trim()
    const timePart = event.date.split('•')[1]?.trim() || ''
    const eventDate = new Date(datePart)
    eventDate.setHours(0, 0, 0, 0)
    const isPast = eventDate.getTime() < today.getTime()

    let status: 'upcoming' | 'waitlisted' | 'past'
    if (isPast) {
      status = 'past'
    } else if (reg.status === 'WAITLISTED') {
      status = 'waitlisted'
    } else {
      status = 'upcoming'
    }

    // Generate a ticket code from event id and registration
    const prefix = event.title.split(' ').map((w: any) => w[0]).join('').toUpperCase().slice(0, 3)
    const ticketCode = `${prefix}-${event.id}-${String(reg.id).slice(0, 4).toUpperCase()}`

    return {
      id: event.id,
      title: event.title,
      category: event.category,
      date: datePart,
      time: timePart,
      location: event.location,
      image: event.image,
      status,
      ticketCode,
      position: reg.status === 'WAITLISTED' ? reg.position : undefined,
    }
  }).filter((event): event is MyEventEnriched => event !== null)
}
