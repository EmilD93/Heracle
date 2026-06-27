import React from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Users,
  Calendar,
  TrendingUp,
  Edit2,
  Send,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { getAllEvents, updateEvent } from '../dataStore'
import { RegistrationsChart } from './RegistrationsChart'

export function OrganizerDashboard({ setActiveTab, onDataChange, onEditEvent }: { setActiveTab: (tab: string) => void, onDataChange?: () => void, onEditEvent?: (id: string) => void }) {
  const EVENTS = getAllEvents()
  const totalRegs = EVENTS.reduce((sum, e) => sum + e.registered, 0)
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
    await updateEvent(id, { status: 'Published' })
    onDataChange?.()
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this event?')) return
    await updateEvent(id, { status: 'Cancelled' })
    onDataChange?.()
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 h-full overflow-y-auto px-10 py-8 hide-scrollbar relative z-10"
    >
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Organizer Dashboard
          </h1>
          <p className="text-slate-500 font-semibold text-lg">
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
              className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-sm border border-slate-100/80 flex items-center gap-6"
            >
              <div
                className={cn(
                  'w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0',
                  stat.color === 'blue'
                    ? 'bg-blue-50 text-blue-600'
                    : stat.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600',
                )}
              >
                <Icon size={28} strokeWidth={2.5} />
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-800 mb-1">
                  {stat.value}
                </div>
                <div className="text-[15px] font-bold text-slate-500">
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
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 overflow-hidden">
          <div className="p-6 border-b border-slate-100/80 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">My Events</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors focus:outline-none">All</button>
              <button className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors focus:outline-none">Published</button>
              <button className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-sm font-bold transition-colors focus:outline-none">Drafts</button>
            </div>
          </div>

          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Event</th>
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Capacity</th>
                  <th className="py-4 px-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {EVENTS.map((event, i) => {
                  const isFull = event.registered >= event.capacity
                  const percentage = Math.min(100, (event.registered / event.capacity) * 100)
                  return (
                    <motion.tr
                      key={event.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <img src={event.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                          <div>
                            <div className="font-bold text-slate-800 text-[15px] mb-0.5">{event.title}</div>
                            <div className="text-sm font-medium text-slate-500">{event.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[15px] font-semibold text-slate-700">{event.date.split('•')[0]}</div>
                        <div className="text-sm font-medium text-slate-500">{event.date.split('•')[1]}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={cn(
                            'px-3 py-1 rounded-lg text-xs font-bold border',
                            event.status === 'Published'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100/50'
                              : event.status === 'Cancelled'
                                ? 'bg-red-50 text-red-700 border-red-100/50'
                                : 'bg-slate-100 text-slate-500 border-slate-200/60',
                          )}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full', isFull ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm font-bold text-slate-600 w-12 text-right">{event.registered}/{event.capacity}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          {event.status === 'Draft' && (
                            <button
                              onClick={() => handlePublish(event.id)}
                              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none"
                              aria-label={`Publish ${event.title}`}
                              title="Publish"
                            >
                              <Send size={18} strokeWidth={2.5} />
                            </button>
                          )}
                          <button
                            onClick={() => onEditEvent?.(event.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:outline-none"
                            aria-label={`Edit ${event.title}`}
                            title="Edit"
                          >
                            <Edit2 size={18} strokeWidth={2.5} />
                          </button>
                          {event.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleCancel(event.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus:outline-none"
                              aria-label={`Cancel ${event.title}`}
                              title="Cancel"
                            >
                              <XCircle size={18} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/80">
              <h2 className="text-xl font-bold text-slate-800">Recent Registrations</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-4">
              {[
                { name: 'Sarah Jenkins', event: 'Tech Innovation Hackathon', time: '2 mins ago' },
                { name: 'Michael Chen', event: 'Varsity Basketball', time: '15 mins ago' },
                { name: 'Emma Wilson', event: 'Campus Club Fair', time: '1 hour ago' },
                { name: 'James Rodriguez', event: 'Fall Semester Orientation', time: '2 hours ago' },
                { name: 'Olivia Taylor', event: 'Tech Innovation Hackathon', time: '3 hours ago' },
              ].map((reg, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                    {reg.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-slate-800 truncate">{reg.name}</div>
                    <div className="text-sm font-medium text-slate-500 truncate">{reg.event}</div>
                  </div>
                  <div className="text-xs font-bold text-slate-400 shrink-0">{reg.time}</div>
                </div>
              ))}
              <button className="mt-auto pt-4 w-full text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors focus:outline-none">
                View All Activity
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] shadow-sm border border-slate-100/80 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-[0.85rem] bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Waitlist Overview</h2>
            </div>
            <div className="p-6 flex-1 flex flex-col gap-5">
              {[
                { title: 'Varsity Basketball Season Opener', count: 84 },
                { title: 'Guest Lecture: Future of AI', count: 32 },
                { title: 'Campus Club Fair', count: 12 },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4">
                  <span className="text-[15px] font-bold text-slate-700 truncate">
                    {item.title}
                  </span>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-extrabold border border-amber-100/60 shrink-0">
                    {item.count} waiting
                  </span>
                </div>
              ))}
              <button className="mt-auto pt-2 w-full text-sm font-bold text-amber-600 hover:text-amber-700 transition-colors focus:outline-none">
                Manage Waitlists
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}