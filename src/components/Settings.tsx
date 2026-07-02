import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, User, GraduationCap, Briefcase, Bell, LogOut, Clock } from 'lucide-react'
import { cn } from '../utils/cn'
import type { UserAccount } from '../authStore'

const NOTIFICATIONS_KEY = 'heracle_pref_email_notifications'

interface SettingsProps {
  user: UserAccount
  onLogout: () => void
}

export function Settings({ user, onLogout }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(
    () => localStorage.getItem(NOTIFICATIONS_KEY) !== 'false',
  )

  const toggleNotifications = () => {
    setEmailNotifications(prev => {
      const next = !prev
      localStorage.setItem(NOTIFICATIONS_KEY, String(next))
      return next
    })
  }

  const initials = user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex-1 h-full overflow-y-auto overflow-x-hidden px-10 py-8 hide-scrollbar relative z-10"
    >
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
          Settings
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-semibold text-lg">
          Manage your account and preferences
        </p>
      </header>

      <div className="max-w-2xl flex flex-col gap-8 pb-10">
        {/* Profile */}
        <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80 dark:border-slate-700/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Profile</h2>

          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl shadow-sm shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{user.fullName}</p>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 mt-1.5 text-xs font-bold px-2.5 py-1 rounded-full border capitalize',
                  user.role === 'organizer'
                    ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-500/20'
                    : 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-500/20',
                )}
              >
                {user.role === 'organizer' ? <Briefcase size={12} strokeWidth={2.5} /> : <GraduationCap size={12} strokeWidth={2.5} />}
                {user.role}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <div className="w-full pl-11 pr-4 py-3.5 rounded-[0.9rem] border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-medium text-sm">
                  {user.fullName}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <div className="w-full pl-11 pr-4 py-3.5 rounded-[0.9rem] border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-medium text-sm">
                  {user.email}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[0.9rem] px-4 py-3">
            <Clock size={14} strokeWidth={2.5} className="shrink-0" />
            Editing your profile isn't available yet — this is read-only until account updates ship on the backend.
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80 dark:border-slate-700/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Preferences</h2>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-[1rem] bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Bell size={19} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Email notifications</p>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Get notified about registration confirmations and waitlist updates
                </p>
              </div>
            </div>
            <button
              onClick={toggleNotifications}
              role="switch"
              aria-checked={emailNotifications}
              aria-label="Toggle email notifications"
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 focus:outline-none',
                emailNotifications ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200',
                  emailNotifications && 'translate-x-5',
                )}
              />
            </button>
          </div>
        </section>

        {/* Account actions */}
        <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80 dark:border-slate-700/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Account</h2>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-5 py-3.5 rounded-[1.1rem] bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={16} strokeWidth={2.5} />
            Sign out
          </button>
        </section>
      </div>
    </motion.div>
  )
}
