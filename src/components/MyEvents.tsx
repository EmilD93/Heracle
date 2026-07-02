import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  Ticket,
  ChevronRight,
  X,
  Search,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { getMyEvents } from '../dataStore'
import type { MyEventEnriched } from '../dataStore'

// ─── Status config ────────────────────────────────────────────────────────────

type EventStatus = 'upcoming' | 'waitlisted' | 'past'

const STATUS_CONFIG: Record<
  EventStatus,
  { label: string; dot: string; badge: string; text: string }
> = {
  upcoming: {
    label: 'Upcoming',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  waitlisted: {
    label: 'Waitlisted',
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
  },
  past: {
    label: 'Past',
    dot: 'bg-slate-300 dark:bg-slate-600',
    badge: 'bg-slate-50 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-600',
    text: 'text-slate-400 dark:text-slate-500',
  },
}

// ─── Ticket Modal ─────────────────────────────────────────────────────────────

function TicketModal({
  event,
  onClose,
}: {
  event: MyEventEnriched
  onClose: () => void
}) {
  const cfg = STATUS_CONFIG[event.status]
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/30 dark:bg-slate-950/60 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-10 w-9 h-9 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-600/80 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 transition-colors"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* Hero image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
          <span className="absolute bottom-4 left-5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/20">
            {event.category}
          </span>
        </div>

        {/* Dashed divider */}
        <div className="relative flex items-center">
          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-900 -ml-3.5 border border-slate-100 dark:border-slate-700 shrink-0" />
          <div className="flex-1 border-t-2 border-dashed border-slate-100 dark:border-slate-700 mx-2" />
          <div className="w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-900 -mr-3.5 border border-slate-100 dark:border-slate-700 shrink-0" />
        </div>

        {/* Ticket body */}
        <div className="px-7 pt-5 pb-8">
          <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1 leading-tight">
            {event.title}
          </h3>
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border mb-5',
              cfg.badge,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>

          <div className="space-y-3 mb-6">
            {[
              { icon: Calendar, label: event.date },
              { icon: Clock, label: event.time },
              { icon: MapPin, label: event.location },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <div className="w-8 h-8 rounded-[0.75rem] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <Icon size={15} strokeWidth={2.5} />
                </div>
                {label}
              </div>
            ))}
          </div>

          {/* Barcode-style ticket code or Waitlist Info */}
          {event.status === 'waitlisted' && event.position ? (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-[1.25rem] p-4 text-center border border-amber-200 dark:border-amber-500/20">
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Your Waitlist Position</p>
              <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">#{event.position}</p>
              <p className="text-xs font-semibold text-amber-700/80 dark:text-amber-400/80 mt-2">We'll notify you if a spot opens up!</p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[1.25rem] p-4 text-center border border-slate-100 dark:border-slate-700">
              <div className="flex justify-center gap-px mb-2.5">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-slate-800 dark:bg-slate-200 rounded-sm"
                    style={{
                      width: [1, 2, 1, 3, 1, 2, 1, 1, 3, 1][i % 10] + 1,
                      height: i % 5 === 0 ? 28 : 20,
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 tracking-widest">
                {event.ticketCode}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Event Row ────────────────────────────────────────────────────────────────

function EventRow({
  event,
  onViewTicket,
}: {
  event: MyEventEnriched
  onViewTicket: (event: MyEventEnriched) => void
}) {
  const cfg = STATUS_CONFIG[event.status]
  const isPast = event.status === 'past'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex items-center gap-5 bg-white dark:bg-slate-800 rounded-[1.75rem] p-4 border border-slate-100/80 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:shadow-blue-900/5 transition-all duration-300',
        isPast && 'opacity-60',
      )}
    >
      {/* Thumbnail */}
      <div className="relative w-20 h-20 rounded-[1.25rem] overflow-hidden shrink-0">
        <img
          src={event.image}
          alt={event.title}
          className={cn(
            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
            isPast && 'grayscale',
          )}
        />
        {isPast && (
          <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center">
            <Check size={18} strokeWidth={3} className="text-white drop-shadow" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border',
              cfg.badge,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
            {cfg.label}
          </span>
          {event.status === 'waitlisted' && event.position && (
             <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded-md">
               Pos: #{event.position}
             </span>
          )}
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {event.category}
          </span>
        </div>
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 truncate mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {event.title}
        </h3>
        <div className="flex items-center gap-4 text-[13px] text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={2.5} />
            {event.date}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={13} strokeWidth={2.5} />
            <span className="truncate max-w-[160px]">{event.location}</span>
          </span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={() => onViewTicket(event)}
        className={cn(
          'shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-[1rem] text-[13px] font-bold transition-all duration-300 focus:outline-none',
          isPast
            ? 'bg-slate-50 dark:bg-slate-700/60 text-slate-400 dark:text-slate-400 border border-slate-100 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200'
            : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-100/50 dark:border-blue-500/20',
        )}
      >
        <Ticket size={14} strokeWidth={2.5} />
        {isPast ? 'Receipt' : 'Ticket'}
        <ChevronRight size={13} strokeWidth={2.5} />
      </button>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const TABS = ['All', 'Upcoming', 'Waitlisted', 'Past'] as const
type Tab = (typeof TABS)[number]

interface MyEventsProps {
  userEmail: string
}

export function MyEvents({ userEmail }: MyEventsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('All')
  const [selectedEvent, setSelectedEvent] = useState<MyEventEnriched | null>(null)
  const [query, setQuery] = useState('')

  const MY_EVENTS = getMyEvents(userEmail)

  const filtered = MY_EVENTS.filter((e) => {
    const matchesTab =
      activeTab === 'All' ||
      e.status === activeTab.toLowerCase()
    const matchesQuery =
      query.trim() === '' ||
      e.title.toLowerCase().includes(query.toLowerCase()) ||
      e.location.toLowerCase().includes(query.toLowerCase())
    return matchesTab && matchesQuery
  })

  const counts: Record<Tab, number> = {
    All: MY_EVENTS.length,
    Upcoming: MY_EVENTS.filter((e) => e.status === 'upcoming').length,
    Waitlisted: MY_EVENTS.filter((e) => e.status === 'waitlisted').length,
    Past: MY_EVENTS.filter((e) => e.status === 'past').length,
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex-1 h-full overflow-y-auto px-10 py-8 hide-scrollbar relative z-10"
      >
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              My Events
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
              Manage your registrations and tickets
            </p>
          </div>

          <div className="relative group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
              size={20}
              strokeWidth={2.5}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search my events..."
              className="w-72 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-[1.25rem] py-3.5 pl-12 pr-4 text-[15px] font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
        </header>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            {
              label: 'Upcoming',
              count: counts.Upcoming,
              color: 'from-blue-500 to-indigo-600',
              light: 'bg-blue-50 text-blue-600',
            },
            {
              label: 'Waitlisted',
              count: counts.Waitlisted,
              color: 'from-amber-400 to-orange-500',
              light: 'bg-amber-50 text-amber-600',
            },
            {
              label: 'Attended',
              count: counts.Past,
              color: 'from-emerald-400 to-teal-500',
              light: 'bg-emerald-50 text-emerald-600',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-slate-800 rounded-[1.75rem] p-6 border border-slate-100/80 dark:border-slate-700/80 shadow-sm flex items-center gap-4"
            >
              <div
                className={cn(
                  'w-12 h-12 rounded-[1.25rem] flex items-center justify-center text-white text-xl font-extrabold shadow-sm bg-gradient-to-br',
                  stat.color,
                )}
              >
                {stat.count}
              </div>
              <span className="text-[15px] font-bold text-slate-600 dark:text-slate-300">
                {stat.label}
              </span>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-3 mb-8">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2.5 rounded-[1rem] text-[14px] font-bold transition-all duration-300 focus:outline-none flex items-center gap-2',
                activeTab === tab
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-800/20'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700',
              )}
            >
              {tab}
              <span
                className={cn(
                  'text-[11px] font-extrabold px-1.5 py-0.5 rounded-md',
                  activeTab === tab
                    ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
                )}
              >
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>

        {/* Event list */}
        <div className="space-y-3 pb-10">
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  onViewTicket={setSelectedEvent}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center"
              >
                <div className="w-16 h-16 rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center mb-5">
                  <Ticket size={26} className="text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                </div>
                <p className="text-lg font-bold text-slate-600 dark:text-slate-300">No events here</p>
                <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {query ? 'Try a different search term' : "You haven't registered for any events yet"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Ticket modal */}
      <AnimatePresence>
        {selectedEvent && (
          <TicketModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
