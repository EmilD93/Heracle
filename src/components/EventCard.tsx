import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Check, Clock } from 'lucide-react'
import { cn } from '../utils/cn'
import { getEventById, getUserRegistrationForEvent, registerForEvent } from '../dataStore'
interface EventCardProps {
  id: string
  title: string
  description: string
  date: string
  image: string
  capacity: number
  registered: number
  category: string
  userEmail?: string
  onSelect?: (id: string) => void
  onDataChange?: () => void
}
export function EventCard({
  id,
  title,
  description,
  date,
  image,
  capacity,
  registered: initialRegistered,
  category,
  userEmail,
  onSelect,
  onDataChange,
}: EventCardProps) {
  const currentEvent = getEventById(id)
  const existingReg = userEmail ? getUserRegistrationForEvent(userEmail, id) : undefined
  const [registered, setRegistered] = useState(currentEvent?.registered ?? initialRegistered)
  const [status, setStatus] = useState<'idle' | 'registered' | 'waitlisted'>(
    existingReg
      ? existingReg.status === 'CONFIRMED' ? 'registered' : 'waitlisted'
      : 'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isFull = registered >= capacity
  const percentage = Math.min(100, (registered / capacity) * 100)
  const handleAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (status !== 'idle' || !userEmail || isSubmitting) return
    setError(null)
    setIsSubmitting(true)
    const result = await registerForEvent(userEmail, id)
    setIsSubmitting(false)
    if (!result.ok) {
      setError(result.error || 'Registration failed')
      return
    }

    if (result.registration.status === 'CONFIRMED') {
      setStatus('registered')
      setRegistered((r) => r + 1)
    } else {
      setStatus('waitlisted')
    }
    if (onDataChange) onDataChange()
  }
  const buttonLabel =
    status === 'registered'
      ? 'Registered'
      : status === 'waitlisted'
        ? 'On Waitlist'
        : isSubmitting
          ? 'Registering…'
          : isFull
            ? 'Join Waitlist'
            : 'Register Now'
  const isDone = status !== 'idle'
  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 24,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 12,
      }}
      transition={{
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -6,
      }}
      onClick={() => onSelect?.(id)}
      className={cn(
        'group bg-white dark:bg-slate-800 rounded-[2rem] p-3 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-shadow duration-500 border border-slate-100/80 dark:border-slate-700/80 flex flex-col h-full',
        onSelect && 'cursor-pointer',
      )}
    >
      <div className="relative h-52 rounded-[1.5rem] overflow-hidden mb-5">
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 z-20">
          <span className="px-3.5 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-xs font-bold text-slate-700 shadow-sm">
            {category}
          </span>
        </div>
      </div>

      <div className="px-3 pb-3 flex flex-col flex-1">
        <h3 className="text-[1.35rem] font-bold text-slate-800 dark:text-slate-100 mb-2.5 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
          {title}
        </h3>
        <p className="text-[15px] text-slate-500 dark:text-slate-400 mb-7 line-clamp-2 leading-relaxed font-medium">
          {description}
        </p>

        <div className="mt-auto space-y-6">
          <div className="flex items-center gap-3 text-[15px] text-slate-600 dark:text-slate-300 font-semibold">
            <div className="w-10 h-10 rounded-[0.85rem] bg-blue-50/80 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Calendar size={18} strokeWidth={2.5} />
            </div>
            {date}
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between text-[13px] font-bold">
              <span
                className={cn(isFull ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')}
              >
                {isFull
                  ? 'Waitlist Only'
                  : `${capacity - registered} spots left`}
              </span>
              <span className="text-slate-400 dark:text-slate-500">
                {registered}/{capacity}
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  isFull
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                    : 'bg-gradient-to-r from-emerald-400 to-teal-500',
                )}
                initial={{
                  width: 0,
                }}
                animate={{
                  width: `${percentage}%`,
                }}
                transition={{
                  duration: 1,
                  ease: 'easeOut',
                }}
              />
            </div>
          </div>

          <motion.button
            onClick={handleAction}
            disabled={isDone || isSubmitting}
            whileTap={{
              scale: isDone || isSubmitting ? 1 : 0.97,
            }}
            aria-label={`${buttonLabel}: ${title}`}
            className={cn(
              'w-full py-4 rounded-[1.25rem] font-bold text-[15px] transition-colors duration-300 shadow-sm hover:shadow-md flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20',
              status === 'registered'
                ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-default'
                : status === 'waitlisted'
                  ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 cursor-default'
                  : isSubmitting
                    ? 'bg-blue-400 text-white/80 cursor-not-allowed'
                    : isFull
                      ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700',
            )}
          >
            {status === 'registered' && <Check size={18} strokeWidth={3} />}
            {status === 'waitlisted' && <Clock size={18} strokeWidth={2.5} />}
            {buttonLabel}
          </motion.button>
          {error && (
            <p className="text-xs font-semibold text-red-500 text-center" onClick={(e) => e.stopPropagation()}>
              {error}
            </p>
          )}
        </div>
      </div>
    </motion.article>
  )
}
