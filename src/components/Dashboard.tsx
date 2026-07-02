import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EventCard } from './EventCard'
import { Bell, BellOff, Check, Search, SlidersHorizontal, AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '../utils/cn'
import { getAllEvents } from '../dataStore'

const FILTERS = [
  'All Events',
  'Academic',
  'Sports',
  'Social',
  'Technology',
  'Entertainment',
] as const

const AVAILABILITY_OPTIONS = [
  { value: 'all', label: 'All events' },
  { value: 'available', label: 'Available only' },
  { value: 'waitlist', label: 'Waitlist only' },
] as const

type AvailabilityFilter = (typeof AVAILABILITY_OPTIONS)[number]['value']

interface DashboardProps {
  userEmail: string
  onEventSelect: (id: string) => void
  onDataChange: () => void
  isLoading?: boolean
  loadError?: boolean
  onRetry?: () => void
}

export function Dashboard({ userEmail, onEventSelect, onDataChange, isLoading, loadError, onRetry }: DashboardProps) {
  const EVENTS = getAllEvents()
  const [activeFilter, setActiveFilter] = useState<string>('All Events')
  const [query, setQuery] = useState('')
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  const visibleEvents = EVENTS.filter((event) => {
    if (event.status !== 'Published') return false
    const matchesFilter =
      activeFilter === 'All Events' || event.category === activeFilter
    const matchesQuery =
      query.trim() === '' ||
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.description.toLowerCase().includes(query.toLowerCase())
    const isFull = event.registered >= event.capacity
    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'available' && !isFull) ||
      (availabilityFilter === 'waitlist' && isFull)
    return matchesFilter && matchesQuery && matchesAvailability
  })

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: -20,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      exit={{
        opacity: 0,
        x: 20,
      }}
      className="flex-1 h-full overflow-y-auto px-10 py-8 hide-scrollbar relative z-10"
    >
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            Discover Events
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
            Find and register for upcoming campus activities
          </p>
        </div>

        <div className="flex items-center gap-4">
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
              placeholder="Search events..."
              aria-label="Search events"
              className="w-80 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-[1.25rem] py-3.5 pl-12 pr-4 text-[15px] font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => { setIsFilterOpen(o => !o); setIsNotificationsOpen(false) }}
              aria-expanded={isFilterOpen}
              aria-label="Filter events"
              className={cn(
                'p-3.5 border rounded-[1.25rem] transition-all shadow-sm focus:outline-none',
                availabilityFilter !== 'all'
                  ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
                  : 'bg-white/80 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400',
              )}
            >
              <SlidersHorizontal size={22} strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-900/10 z-50 overflow-hidden p-2"
                  >
                    <p className="px-3 pt-2 pb-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Availability
                    </p>
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setAvailabilityFilter(opt.value); setIsFilterOpen(false) }}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2.5 rounded-[0.9rem] text-[14px] font-semibold transition-colors',
                          availabilityFilter === opt.value
                            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
                        )}
                      >
                        {opt.label}
                        {availabilityFilter === opt.value && <Check size={15} strokeWidth={3} />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => { setIsNotificationsOpen(o => !o); setIsFilterOpen(false) }}
              aria-expanded={isNotificationsOpen}
              aria-label="Notifications"
              className="relative p-3.5 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-[1.25rem] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-sm focus:outline-none"
            >
              <Bell size={22} strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {isNotificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-[1.25rem] border border-slate-100 dark:border-slate-700 shadow-xl shadow-slate-900/10 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700">
                      <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                      <div className="w-12 h-12 rounded-[1rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-3">
                        <BellOff size={20} className="text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No notifications yet</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        We'll let you know about registration updates here.
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <div className="flex gap-3 mb-10 overflow-x-auto pb-2 hide-scrollbar">
        {FILTERS.map((tag) => {
          const isActive = activeFilter === tag
          return (
            <button
              key={tag}
              onClick={() => setActiveFilter(tag)}
              aria-pressed={isActive}
              className={cn(
                'px-6 py-3 rounded-[1.25rem] text-[15px] font-bold whitespace-nowrap transition-all duration-300 focus:outline-none',
                isActive
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-800/20'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700',
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-[26rem] rounded-[2rem] bg-white/60 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/80 animate-pulse"
            />
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 shadow-sm flex items-center justify-center mb-5">
            <AlertTriangle size={26} className="text-red-400" strokeWidth={2.5} />
          </div>
          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Couldn't load events</p>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1 mb-6">
            We couldn't reach the server. Check your connection and try again.
          </p>
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[1rem] text-sm font-bold bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md shadow-slate-800/20 hover:bg-slate-900 dark:hover:bg-white transition-colors"
          >
            <RefreshCw size={15} strokeWidth={2.5} />
            Retry
          </button>
        </div>
      ) : visibleEvents.length > 0 ? (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 pb-10"
        >
          <AnimatePresence mode="popLayout">
            {visibleEvents.map((event) => (
              <EventCard key={event.id} {...event} userEmail={userEmail} onSelect={onEventSelect} onDataChange={onDataChange} />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center mb-5">
            <Search size={26} className="text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
          </div>
          <p className="text-lg font-bold text-slate-600 dark:text-slate-300">No events found</p>
          <p className="text-slate-400 dark:text-slate-500 font-medium mt-1">
            Try a different category or search term
          </p>
        </div>
      )}
    </motion.div>
  )
}