import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { getEventById, getUserRegistrationForEvent, registerForEvent } from '../dataStore'

interface EventDetailsProps {
  eventId: string
  userEmail: string
  onBack: () => void
  onDataChange: () => void
}

export function EventDetails({ eventId, userEmail, onBack, onDataChange }: EventDetailsProps) {
  const event = getEventById(eventId)
  const existingReg = getUserRegistrationForEvent(userEmail, eventId)

  const [registered, setRegistered] = useState(event?.registered || 0)
  const [status, setStatus] = useState<'idle' | 'registered' | 'waitlisted'>(
    existingReg
      ? existingReg.status === 'CONFIRMED' ? 'registered' : 'waitlisted'
      : 'idle',
  )

  if (!event) return null

  const isFull = registered >= event.capacity
  const percentage = Math.min(100, (registered / event.capacity) * 100)

  const handleAction = async () => {
    if (status !== 'idle') return
    const result = await registerForEvent(userEmail, eventId)
    if (!result.ok) return

    if (result.registration.status === 'CONFIRMED') {
      setStatus('registered')
      setRegistered(r => r + 1)
    } else {
      setStatus('waitlisted')
    }
    onDataChange()
  }

  const buttonLabel =
    status === 'registered'
      ? 'Registered'
      : status === 'waitlisted'
        ? 'On Waitlist'
        : isFull
          ? 'Join Waitlist'
          : 'Register Now'
  const isDone = status !== 'idle'

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 h-full overflow-y-auto custom-scrollbar relative z-10"
    >
      <div className="p-10 pb-20 max-w-5xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-8 transition-colors group"
        >
          <div className="w-10 h-10 rounded-[1rem] bg-white/80 border border-slate-200/80 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-sm">
            <ArrowLeft
              size={20}
              strokeWidth={2.5}
              className="group-hover:-translate-x-1 transition-transform"
            />
          </div>
          Back to Dashboard
        </button>

        <div className="relative h-80 rounded-[2.5rem] overflow-hidden mb-10 shadow-sm border border-slate-100/50">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent z-10" />
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-8 left-8 z-20">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold text-white shadow-sm mb-4 inline-block border border-white/20">
              {event.category}
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-tight max-w-2xl">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80">
              <h2 className="text-2xl font-bold text-slate-800 mb-4">
                About this event
              </h2>
              <p className="text-slate-600 leading-relaxed text-[15px] font-medium">
                {event.description}
              </p>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Schedule
              </h2>
              <div className="space-y-6">
                {event.agenda?.map((item, i) => (
                  <div key={i} className="flex gap-6 relative">
                    {i !== event.agenda!.length - 1 && (
                      <div className="absolute left-[11px] top-8 bottom-[-24px] w-0.5 bg-slate-100" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-blue-50 border-4 border-white shadow-sm flex-shrink-0 z-10 mt-1" />
                    <div>
                      <div className="text-[15px] font-bold text-blue-600 mb-1">
                        {item.time}
                      </div>
                      <div className="text-[15px] font-medium text-slate-700">
                        {item.activity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            <section className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Event Details
              </h2>

              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <Calendar size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-1">
                      Date & Time
                    </div>
                    <div className="text-[15px] font-semibold text-slate-800">
                      {event.date}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-[1.25rem] bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-500 mb-1">
                      Location
                    </div>
                    <div className="text-[15px] font-semibold text-slate-800">
                      {event.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <div className="flex justify-between text-[14px] font-bold mb-3">
                  <span
                    className={cn(
                      isFull ? 'text-amber-600' : 'text-emerald-600',
                    )}
                  >
                    {isFull
                      ? 'Waitlist Only'
                      : `${event.capacity - registered} spots left`}
                  </span>
                  <span className="text-slate-400">
                    {registered}/{event.capacity}
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                  <motion.div
                    className={cn(
                      'h-full rounded-full',
                      isFull
                        ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                        : 'bg-gradient-to-r from-emerald-400 to-teal-500',
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>

                <motion.button
                  onClick={handleAction}
                  disabled={isDone}
                  whileTap={{ scale: isDone ? 1 : 0.97 }}
                  className={cn(
                    'w-full py-4 rounded-[1.25rem] font-bold text-[16px] transition-colors duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2',
                    status === 'registered'
                      ? 'bg-emerald-50 text-emerald-700 cursor-default'
                      : status === 'waitlisted'
                        ? 'bg-amber-100 text-amber-800 cursor-default'
                        : isFull
                          ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700',
                  )}
                >
                  {status === 'registered' && (
                    <Check size={20} strokeWidth={3} />
                  )}
                  {status === 'waitlisted' && (
                    <Clock size={20} strokeWidth={2.5} />
                  )}
                  {buttonLabel}
                </motion.button>
              </div>
            </section>

            <section className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80">
              <h2 className="text-xl font-bold text-slate-800 mb-6">
                Organizer
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border border-slate-200/50">
                  <Users size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-800">
                    {event.organizer?.name}
                  </div>
                  <div className="text-sm font-medium text-slate-500">
                    Event Host
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <a
                  href={`mailto:${event.organizer?.email}`}
                  className="flex items-center gap-3 text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 p-3 rounded-[1rem]"
                >
                  <Mail size={18} className="text-slate-400" />
                  {event.organizer?.email}
                </a>
                <a
                  href={`tel:${event.organizer?.phone}`}
                  className="flex items-center gap-3 text-[14px] font-medium text-slate-600 hover:text-blue-600 transition-colors bg-slate-50 p-3 rounded-[1rem]"
                >
                  <Phone size={18} className="text-slate-400" />
                  {event.organizer?.phone}
                </a>
              </div>
            </section>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
