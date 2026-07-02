import { motion } from 'framer-motion'
import {
  Plus,
  Users,
  Calendar,
  TrendingUp,
  UserMinus,
  Edit2,
  Send,
  XCircle,
  Clock,
  Eye,
  X,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { getOrganizerEvents, publishEvent, cancelEvent, getEventAttendees, kickRegistration } from '../dataStore'
import type { EventAttendee } from '../dataStore'
import { RegistrationsChart } from './RegistrationsChart'
import { useEffect, useMemo, useState } from 'react'

type EventFilter = 'all' | 'published' | 'draft'

type ActivityItem = {
  id: string
  fullName: string
  email: string
  status: 'CONFIRMED' | 'WAITLISTED'
  eventTitle: string
  createdAt: string
}

type WaitlistItem = {
  eventId: string
  title: string
  count: number
}

export function OrganizerDashboard({ setActiveTab, onDataChange, onEditEvent, onPreviewEvent, userEmail }: { setActiveTab: (tab: string) => void, onDataChange?: () => void, onEditEvent?: (id: string) => void, onPreviewEvent?: (id: string) => void, userEmail: string }) {
  const EVENTS = useMemo(() => getOrganizerEvents(userEmail), [userEmail])
  const [error, setError] = useState<string | null>(null)
  const [eventFilter, setEventFilter] = useState<EventFilter>('all')
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [showAllActivity, setShowAllActivity] = useState(false)
  const [showWaitlists, setShowWaitlists] = useState(false)
  const totalRegs = EVENTS.reduce((sum, e) => sum + e.registered, 0)
  const selectedEvent = EVENTS.find(e => String(e.id) === String(selectedEventId))
  const filteredEvents = useMemo(() => {
    if (eventFilter === 'published') return EVENTS.filter(e => e.status === 'Published')
    if (eventFilter === 'draft') return EVENTS.filter(e => e.status === 'Draft')
    return EVENTS
  }, [EVENTS, eventFilter])

  const attendeeStats = useMemo(() => {
    const confirmed = attendees.filter(a => a.status === 'CONFIRMED').length
    const waitlisted = attendees.filter(a => a.status === 'WAITLISTED').length
    return { confirmed, waitlisted }
  }, [attendees])
  const waitlistItems = useMemo<WaitlistItem[]>(() => {
    return EVENTS
      .map(e => ({
        eventId: e.id,
        title: e.title,
        count: Math.max(0, e.registered - e.capacity),
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
  }, [EVENTS])
  const stats = [
    {
      label: 'Total Events',
      value: String(EVENTS.length),
      icon: Calendar,
      color: 'blue',
    },
    {
      label: 'Total Registrations',
      value: totalRegs.toLocaleString(),
      icon: Users,
      color: 'emerald',
    },
    {
      label: 'Full Events',
      value: String(EVENTS.filter(e => e.registered >= e.capacity).length),
      icon: TrendingUp,
      color: 'amber',
    },
  ]

  const handlePublish = async (id: string) => {
    setError(null)
    const result = await publishEvent(id)
    if (!result.ok) {
      setError(result.error || 'Could not publish event')
      return
    }
    onDataChange?.()
  }

  const openAttendees = (id: string) => {
    setSelectedEventId(id)
    setAttendees([])
    setAttendeesError(null)
  }

  useEffect(() => {
    const loadAttendees = async () => {
      if (!selectedEventId) return
      setAttendeesLoading(true)
      const result = await getEventAttendees(selectedEventId)
      setAttendeesLoading(false)
      if (!result.ok) {
        setAttendeesError(result.error || 'Could not load attendees')
        return
      }
      setAttendees(result.data || [])
    }
    loadAttendees()
  }, [selectedEventId])

  useEffect(() => {
    const loadActivity = async () => {
      if (EVENTS.length === 0) {
        setActivityItems([])
        setActivityLoading(false)
        return
      }

      setActivityLoading(true)
      try {
        const results = await Promise.all(
          EVENTS.map(async event => {
            const res = await getEventAttendees(event.id)
            return { event, res }
          }),
        )

        const merged: ActivityItem[] = []
        for (const { event, res } of results) {
          if (!res.ok || !res.data) continue
          for (const attendee of res.data) {
            if (attendee.status === 'CANCELLED') continue
            merged.push({
              id: attendee.registrationId,
              fullName: attendee.fullName,
              email: attendee.email,
              status: attendee.status === 'CONFIRMED' ? 'CONFIRMED' : 'WAITLISTED',
              eventTitle: event.title,
              createdAt: attendee.createdAt,
            })
          }
        }

        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setActivityItems(merged)
      } finally {
        setActivityLoading(false)
      }
    }

    loadActivity()
  }, [EVENTS])

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return
    setError(null)
    const result = await cancelEvent(id)
    if (!result.ok) {
      setError(result.error || 'Could not cancel event')
      return
    }
    onDataChange?.()
  }

  const handleKick = async (registrationId: string) => {
    if (!confirm('Remove this attendee from the event?')) return
    setAttendeesError(null)
    const result = await kickRegistration(registrationId, userEmail)
    if (!result.ok) {
      setAttendeesError(result.error || 'Could not remove attendee')
      return
    }

    if (selectedEventId) {
      const fresh = await getEventAttendees(selectedEventId)
      if (fresh.ok) setAttendees(fresh.data || [])
    }
    onDataChange?.()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 h-full overflow-y-auto px-10 py-8 hide-scrollbar relative z-10"
    >
      {error && (
        <div className="mb-6 px-5 py-3.5 rounded-[1.25rem] bg-red-50 border border-red-100 text-red-700 font-bold text-[14px] flex items-center justify-between gap-4">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 focus:outline-none">✕</button>
        </div>
      )}

      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            Organizer Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
            Manage your events and monitor registrations
          </p>
        </div>

        <button
        onClick={() => setActiveTab('create-event')}
        className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.25rem] font-bold text-[15px] shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] focus:outline-none">
          <Plus size={20} strokeWidth={2.5} />
          Create New Event
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-sm border border-slate-100/80 dark:border-slate-700/80 flex items-center gap-6"
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0',
                  stat.color === 'blue'
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : stat.color === 'emerald'
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
                )}
              >
                <Icon size={28} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-[15px] font-bold text-slate-500 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      <div className="mb-10">
        <RegistrationsChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10 items-start">
        <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 dark:border-slate-700/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100/80 dark:border-slate-700/80 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">My Events</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setEventFilter('all')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-colors focus:outline-none',
                  eventFilter === 'all'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                All
              </button>
              <button
                onClick={() => setEventFilter('published')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-colors focus:outline-none',
                  eventFilter === 'published'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                Published
              </button>
              <button
                onClick={() => setEventFilter('draft')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-bold transition-colors focus:outline-none',
                  eventFilter === 'draft'
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700',
                )}
              >
                Drafts
              </button>
            </div>
          </div>

          <div className="p-4 md:p-5 space-y-3">
            {EVENTS.length === 0 && (
              <div className="py-10 px-6 text-center text-slate-500 dark:text-slate-400 font-semibold">
                You have not created any events yet.
              </div>
            )}
            {EVENTS.length > 0 && filteredEvents.length === 0 && (
              <div className="py-10 px-6 text-center text-slate-500 dark:text-slate-400 font-semibold">
                No events in this filter.
              </div>
            )}

            {filteredEvents.map((event, i) => (
              <motion.button
                key={event.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => onPreviewEvent?.(event.id)}
                className="w-full text-left rounded-2xl border border-slate-100/80 dark:border-slate-700/80 bg-slate-50/40 dark:bg-slate-900/30 p-4 hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img src={event.image} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-[16px] truncate">{event.title}</p>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{event.category}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{event.date.split('•')[0]}</span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">{event.date.split('•')[1]}</span>
                      <span
                        className={cn(
                          'ml-0 md:ml-2 px-2.5 py-1 rounded-lg text-xs font-bold border',
                          event.status === 'Published'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/20'
                            : event.status === 'Cancelled'
                              ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-100/50 dark:border-red-500/20'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-600/60',
                        )}
                      >
                        {event.status}
                      </span>
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Capacity: {event.registered}/{event.capacity}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {event.status === 'Draft' && (
                    <button
                      onClick={() => handlePublish(event.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <Send size={14} />
                      Publish
                    </button>
                  )}
                  <button
                    onClick={() => openAttendees(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
                  >
                    <Users size={14} />
                    Attendees
                  </button>
                  <button
                    onClick={() => onPreviewEvent?.(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-sky-100 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors"
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                  <button
                    onClick={() => onEditEvent?.(event.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                  >
                    <Edit2 size={14} />
                    Edit
                  </button>
                  {event.status !== 'Cancelled' && (
                    <button
                      onClick={() => handleCancel(event.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                    >
                      <XCircle size={14} />
                      Cancel
                    </button>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 dark:border-slate-700/80 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/80 dark:border-slate-700/80">
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Recent Registrations</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {activityLoading ? (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading activity…</p>
              ) : activityItems.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No registrations yet.</p>
              ) : (
                activityItems.slice(0, 5).map((reg) => (
                  <div key={reg.id} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-500/20 dark:to-indigo-500/20 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm shrink-0">
                      {reg.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate">{reg.fullName}</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{reg.eventTitle}</div>
                    </div>
                    <div className={cn(
                      'text-xs font-bold shrink-0',
                      reg.status === 'CONFIRMED' ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400',
                    )}>
                      {reg.status === 'CONFIRMED' ? 'Joined' : 'Waitlist'}
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={() => setShowAllActivity(true)}
                className="mt-auto pt-4 w-full text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus:outline-none"
              >
                View All Activity
              </button>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 dark:border-slate-700/80 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/80 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[0.85rem] bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Waitlist Overview</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-5">
              {waitlistItems.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No waitlisted attendees.</p>
              ) : (
                waitlistItems.slice(0, 3).map((item) => (
                  <div key={item.eventId} className="flex items-center justify-between gap-4">
                    <span className="text-[15px] font-bold text-slate-700 dark:text-slate-300 truncate">
                      {item.title}
                    </span>
                    <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-extrabold border border-amber-100/60 dark:border-amber-500/20 shrink-0">
                      {item.count} waiting
                    </span>
                  </div>
                ))
              )}
              <button
                onClick={() => setShowWaitlists(true)}
                className="mt-auto pt-2 w-full text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors focus:outline-none"
              >
                Manage Waitlists
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEventId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedEventId(null)} />
          <div className="relative w-full max-w-3xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{selectedEvent?.title}</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Attendees and waitlist</p>
              </div>
              <button
                onClick={() => setSelectedEventId(null)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-4 grid grid-cols-2 gap-4 border-b border-slate-100 dark:border-slate-700">
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Confirmed</p>
                <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">{attendeeStats.confirmed}</p>
              </div>
              <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Waitlisted</p>
                <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-400">{attendeeStats.waitlisted}</p>
              </div>
            </div>

            <div className="max-h-[26rem] overflow-y-auto overflow-x-auto">
              {attendeesLoading ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">Loading attendees…</div>
              ) : attendeesError ? (
                <div className="p-8 text-center text-red-600 dark:text-red-400 font-semibold">{attendeesError}</div>
              ) : attendees.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">No registrations yet.</div>
              ) : (
                <table className="w-full min-w-[760px] text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70">
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Email</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {attendees.map(a => (
                      <tr key={a.registrationId}>
                        <td className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200">
                          <div className="flex items-center gap-2.5">
                            {a.profilePhotoUrl ? (
                              <img src={a.profilePhotoUrl} alt={a.fullName} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                                {a.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <span>{a.fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-slate-500 dark:text-slate-400">{a.email}</td>
                        <td className="py-3 px-6">
                          <span className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold border',
                            a.status === 'CONFIRMED'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                              : a.status === 'WAITLISTED'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600',
                          )}>
                            {a.status === 'WAITLISTED' && a.position ? `WAITLISTED #${a.position}` : a.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          {a.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleKick(a.registrationId) }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-red-100 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                            >
                              <UserMinus size={13} />
                              Kick Student
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showAllActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAllActivity(false)} />
          <div className="relative w-full max-w-3xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">All Registration Activity</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Latest registrations across your events</p>
              </div>
              <button
                onClick={() => setShowAllActivity(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-[28rem] overflow-y-auto">
              {activityLoading ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">Loading activity…</div>
              ) : activityItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">No registrations yet.</div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/70">
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Name</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Event</th>
                      <th className="py-3 px-6 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {activityItems.map(item => (
                      <tr key={item.id}>
                        <td className="py-3 px-6 font-semibold text-slate-700 dark:text-slate-200">{item.fullName}</td>
                        <td className="py-3 px-6 text-slate-600 dark:text-slate-300">{item.eventTitle}</td>
                        <td className="py-3 px-6">
                          <span className={cn(
                            'px-2.5 py-1 rounded-lg text-xs font-bold border',
                            item.status === 'CONFIRMED'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
                          )}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {showWaitlists && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowWaitlists(false)} />
          <div className="relative w-full max-w-2xl rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">Manage Waitlists</h3>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">Open an event waitlist and remove attendees if needed.</p>
              </div>
              <button
                onClick={() => setShowWaitlists(false)}
                className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center justify-center"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-[24rem] overflow-y-auto p-4">
              {waitlistItems.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400 font-semibold">No waitlists to manage right now.</div>
              ) : (
                <div className="space-y-3">
                  {waitlistItems.map(item => (
                    <button
                      key={item.eventId}
                      onClick={() => {
                        setShowWaitlists(false)
                        openAttendees(item.eventId)
                      }}
                      className="w-full text-left p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-500/30 hover:bg-amber-50/30 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100 truncate">{item.title}</span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold border bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20 shrink-0">
                          {item.count} waiting
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}