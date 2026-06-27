// ─── Persistent Data Store (localStorage) ─────────────────────────────────────
// This module manages all app data in localStorage so changes persist
// across sessions. When a real backend API is ready, swap these functions
// for fetch() calls — the component interfaces stay the same.

import { EVENTS as SEED_EVENTS } from './data/events'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EventData {
  id: number
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
  eventId: number
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

export function getAllEvents(): EventData[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getEventById(id: number): EventData | undefined {
  return getAllEvents().find(e => e.id === id)
}

export function createEvent(event: Omit<EventData, 'id' | 'registered'>): EventData {
  const events = getAllEvents()
  const newId = events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1
  const newEvent: EventData = {
    ...event,
    id: newId,
    registered: 0,
  }
  events.push(newEvent)
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  return newEvent
}

export function updateEvent(id: number, updates: Partial<EventData>) {
  const events = getAllEvents()
  const idx = events.findIndex(e => e.id === id)
  if (idx === -1) return
  events[idx] = { ...events[idx], ...updates }
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
}

export function deleteEvent(id: number) {
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

export function getRegistrationsForEvent(eventId: number): Registration[] {
  return getAllRegistrations().filter(
    r => r.eventId === eventId && r.status !== 'CANCELLED'
  )
}

export function getUserRegistrationForEvent(userEmail: string, eventId: number): Registration | undefined {
  return getAllRegistrations().find(
    r => r.userEmail === userEmail && r.eventId === eventId && r.status !== 'CANCELLED'
  )
}

export function registerForEvent(
  userEmail: string,
  eventId: number
): { ok: true; registration: Registration } | { ok: false; error: string } {
  // Check if already registered
  const existing = getUserRegistrationForEvent(userEmail, eventId)
  if (existing) {
    return { ok: false, error: 'You are already registered for this event' }
  }

  const event = getEventById(eventId)
  if (!event) return { ok: false, error: 'Event not found' }

  const eventRegs = getRegistrationsForEvent(eventId)
  const confirmedCount = eventRegs.filter(r => r.status === 'CONFIRMED').length
  const isFull = confirmedCount >= event.capacity

  const allRegs = getAllRegistrations()
  const position = eventRegs.length + 1

  const newReg: Registration = {
    id: crypto.randomUUID(),
    userEmail,
    eventId,
    status: isFull ? 'WAITLISTED' : 'CONFIRMED',
    position,
    createdAt: new Date().toISOString(),
  }

  allRegs.push(newReg)
  saveRegistrations(allRegs)

  // Update the registered count on the event
  if (!isFull) {
    updateEvent(eventId, { registered: confirmedCount + 1 })
  }

  return { ok: true, registration: newReg }
}

export function cancelRegistration(userEmail: string, eventId: number) {
  const allRegs = getAllRegistrations()
  const idx = allRegs.findIndex(
    r => r.userEmail === userEmail && r.eventId === eventId && r.status !== 'CANCELLED'
  )
  if (idx === -1) return

  const wasConfirmed = allRegs[idx].status === 'CONFIRMED'
  allRegs[idx].status = 'CANCELLED'

  // If the cancelled registration was confirmed, promote the first waitlisted person
  if (wasConfirmed) {
    const waitlisted = allRegs
      .filter(r => r.eventId === eventId && r.status === 'WAITLISTED')
      .sort((a, b) => a.position - b.position)

    if (waitlisted.length > 0) {
      const promoted = allRegs.findIndex(r => r.id === waitlisted[0].id)
      if (promoted !== -1) {
        allRegs[promoted].status = 'CONFIRMED'
      }
    } else {
      // Decrease registered count
      const event = getEventById(eventId)
      if (event) {
        updateEvent(eventId, { registered: Math.max(0, event.registered - 1) })
      }
    }
  }

  saveRegistrations(allRegs)
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
    const event = events.find(e => e.id === reg.eventId)
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
    const prefix = event.title.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
    const ticketCode = `${prefix}-${event.id}-${reg.id.slice(0, 4).toUpperCase()}`

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
