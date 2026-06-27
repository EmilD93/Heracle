import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { EventCard } from './EventCard'
import { Bell, Search, SlidersHorizontal } from 'lucide-react'
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

interface DashboardProps {
  userEmail: string
  onEventSelect: (id: number) => void
  onDataChange: () => void
}

export function Dashboard({ userEmail, onEventSelect, onDataChange }: DashboardProps) {
  const EVENTS = getAllEvents()
  const [activeFilter, setActiveFilter] = useState<string>('All Events')
  const [query, setQuery] = useState('')

  const visibleEvents = EVENTS.filter((event) => {
    const matchesFilter =
      activeFilter === 'All Events' || event.category === activeFilter
    const matchesQuery =
      query.trim() === '' ||
      event.title.toLowerCase().includes(query.toLowerCase()) ||
      event.description.toLowerCase().includes(query.toLowerCase())
    return matchesFilter && matchesQuery
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
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Discover Events
          </h1>
          <p className="text-slate-500 font-semibold text-lg">
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
              className="w-80 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-[1.25rem] py-3.5 pl-12 pr-4 text-[15px] font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>
          <button className="p-3.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-[1.25rem] text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm focus:outline-none">
            <SlidersHorizontal size={22} strokeWidth={2.5} />
          </button>
          <button className="relative p-3.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-[1.25rem] text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm focus:outline-none">
            <Bell size={22} strokeWidth={2.5} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
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
                  ? 'bg-slate-800 text-white shadow-md shadow-slate-800/20'
                  : 'bg-white/80 backdrop-blur-sm text-slate-600 border border-slate-200/80 hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {visibleEvents.length > 0 ? (
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
          <div className="w-16 h-16 rounded-[1.5rem] bg-white/80 border border-slate-100 shadow-sm flex items-center justify-center mb-5">
            <Search size={26} className="text-slate-300" strokeWidth={2.5} />
          </div>
          <p className="text-lg font-bold text-slate-600">No events found</p>
          <p className="text-slate-400 font-medium mt-1">
            Try a different category or search term
          </p>
        </div>
      )}
    </motion.div>
  )
}