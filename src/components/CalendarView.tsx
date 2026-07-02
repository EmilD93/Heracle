import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, MapPin, Clock, CalendarDays } from 'lucide-react'
import { cn } from '../utils/cn'
import { getAllEvents } from '../dataStore'
import type { EventData } from '../dataStore'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayEvent {
  event: EventData
  time: string
}

function parseEventDate(dateStr: string): { day: Date; time: string } | null {
  const [datePart, timePart] = dateStr.split('•').map(s => s.trim())
  const day = new Date(datePart)
  if (Number.isNaN(day.getTime())) return null
  day.setHours(0, 0, 0, 0)
  return { day, time: timePart ?? '' }
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

interface CalendarViewProps {
  onEventSelect: (id: string) => void
}

export function CalendarView({ onEventSelect }: CalendarViewProps) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  const events = getAllEvents()

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEvent[]>()
    for (const event of events) {
      const parsed = parseEventDate(event.date)
      if (!parsed) continue
      const key = parsed.day.toDateString()
      const list = map.get(key) ?? []
      list.push({ event, time: parsed.time })
      map.set(key, list)
    }
    return map
  }, [events])

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(cursor)
    const startOffset = firstOfMonth.getDay()
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(1 - startOffset)

    const days: Date[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      days.push(d)
    }
    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [cursor])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const goPrevMonth = () => {
    setCursor(c => {
      const d = new Date(c)
      d.setMonth(d.getMonth() - 1)
      return d
    })
    setSelectedDay(null)
  }

  const goNextMonth = () => {
    setCursor(c => {
      const d = new Date(c)
      d.setMonth(d.getMonth() + 1)
      return d
    })
    setSelectedDay(null)
  }

  const goToday = () => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    setCursor(d)
    setSelectedDay(new Date(today))
  }

  const selectedDayEvents = selectedDay ? eventsByDay.get(selectedDay.toDateString()) ?? [] : []

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 h-full overflow-y-auto overflow-x-hidden px-10 py-8 hide-scrollbar relative z-10"
    >
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
            Calendar
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
            See what's happening, day by day
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="px-5 py-3 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-[1.1rem] text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            Today
          </button>
          <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-[1.1rem] p-1.5 shadow-sm">
            <button
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="w-9 h-9 rounded-[0.85rem] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <span className="px-3 text-[15px] font-bold text-slate-800 dark:text-slate-100 min-w-[9rem] text-center">
              {monthLabel}
            </span>
            <button
              onClick={goNextMonth}
              aria-label="Next month"
              className="w-9 h-9 rounded-[0.85rem] flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-10">
        <div className="min-w-0 xl:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] border border-slate-100/80 dark:border-slate-700/80 shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100/80 dark:border-slate-700/80">
            {WEEKDAYS.map(w => (
              <div key={w} className="py-3.5 text-center text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-w-0">
            {weeks.flat().map((day, i) => {
              const inMonth = day.getMonth() === cursor.getMonth()
              const isToday = sameDay(day, today)
              const isSelected = selectedDay ? sameDay(day, selectedDay) : false
              const dayEvents = eventsByDay.get(day.toDateString()) ?? []
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'min-h-24 h-full min-w-0 border-b border-r border-slate-100/60 dark:border-slate-700/60 p-2.5 flex flex-col items-start justify-start gap-1.5 text-left transition-colors focus:outline-none',
                    !inMonth && 'bg-slate-50/40 dark:bg-slate-900/40',
                    isSelected && 'bg-blue-50/70 dark:bg-blue-500/10',
                    !isSelected && 'hover:bg-slate-50/70 dark:hover:bg-slate-700/40',
                  )}
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0',
                      isToday
                        ? 'bg-blue-600 text-white'
                        : inMonth
                          ? 'text-slate-700 dark:text-slate-300'
                          : 'text-slate-300 dark:text-slate-600',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-1 w-full overflow-hidden">
                    {dayEvents.slice(0, 2).map(({ event }) => (
                      <span
                        key={event.id}
                        className="text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-500/20 rounded-md px-1.5 py-0.5 truncate w-full"
                      >
                        {event.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="min-w-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] border border-slate-100/80 dark:border-slate-700/80 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {selectedDay
              ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Select a day'}
          </h2>
          <p className="text-sm font-medium text-slate-400 dark:text-slate-500 mb-6">
            {selectedDay ? `${selectedDayEvents.length} event${selectedDayEvents.length === 1 ? '' : 's'}` : 'Tap a date to see what\'s on'}
          </p>

          <AnimatePresence mode="wait">
            {!selectedDay ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                  <CalendarDays size={22} className="text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  Click on any date to view its events
                </p>
              </div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4">
                  <CalendarDays size={22} className="text-slate-300 dark:text-slate-600" strokeWidth={2.5} />
                </div>
                <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                  No events on this day
                </p>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-3"
              >
                {selectedDayEvents.map(({ event, time }) => (
                  <button
                    key={event.id}
                    onClick={() => onEventSelect(event.id)}
                    className="flex items-center gap-4 p-3.5 rounded-[1.25rem] border border-slate-100 dark:border-slate-700 hover:border-blue-100 dark:hover:border-blue-500/30 hover:bg-blue-50/40 dark:hover:bg-blue-500/10 transition-colors text-left"
                  >
                    <img src={event.image} alt="" className="w-14 h-14 rounded-[0.9rem] object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100 truncate mb-1">{event.title}</p>
                      <div className="flex items-center gap-3 text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                        {time && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} strokeWidth={2.5} />
                            {time}
                          </span>
                        )}
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={12} strokeWidth={2.5} />
                          <span className="truncate">{event.location}</span>
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
