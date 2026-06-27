// ─── Persistent Data Store (localStorage) ─────────────────────────────────────
// This module manages all app data in localStorage so changes persist
// across sessions. When a real backend API is ready, swap these functions
// for fetch() calls — the component interfaces stay the same.

import { EVENTS as SEED_EVENTS } from './data/events'

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
  status: 'Published' | 'Draft'
  location: string
  organizer: {
    name: string
    email: string
    phone: string
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

const API_BASE = 'http://localhost:8000/api'

// We still use localStorage as a cache, but we sync it with the backend.
export async function syncWithBackend() {
  try {
    const res = await fetch(`${API_BASE}/events`)
    if (res.ok) {
      const events = await res.json()
      localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
    }
  } catch (err) {
    console.error('Failed to sync events with backend', err)
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

export async function createEvent(event: Omit<EventData, 'id' | 'registered'>): Promise<EventData | null> {
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    })
    if (!res.ok) return null
    await syncWithBackend()
    return { ...event, id: "pending", registered: 0 }
  } catch (err) {
    console.error('Failed to create event', err)
    return null
  }
}

export function updateEvent(id: string, updates: Partial<EventData>) {
  const events = getAllEvents()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) return
  events[idx] = { ...events[idx], ...updates }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
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

export async function registerForEvent(userEmail: string, eventId: string | number): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/registrations/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userEmail })
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.detail || 'Failed to register' }

    // Save to local cache so it persists on refresh
    const allRegs = getAllRegistrations()
    allRegs.push(data.registration)
    saveRegistrations(allRegs)

    // Sync events to get updated capacity
    await syncWithBackend()

    return data
  } catch (err) {
    console.error('Failed to register', err)
    return { ok: false, error: 'Network error' }
  }
}

// ─── Helper: Get "My Events" enriched data ────────────────────────────────────

export interface MyEventEnriched {
  id: number
  title: string
  category: string
  date: string
  time: string
  location: string
  image: string
  status: 'upcoming' | 'waitlisted' | 'past'
  ticketCode: string
  position?: number
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
  }).filter(Boolean) as MyEventEnriched[]
}
