import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  User,
  GraduationCap,
  Briefcase,
  Bell,
  LogOut,
  Save,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '../utils/cn'
import type { UserAccount } from '../authStore'
import { getUserProfile, updateUserProfile } from '../dataStore'

const NOTIFICATIONS_KEY = 'heracle_pref_email_notifications'

interface SettingsProps {
  user: UserAccount
  onLogout: () => void
  onUserUpdate: (user: UserAccount) => void
}

type PersistedProfile = {
  fullName: string
  photoUrl?: string
  bio?: string
  phone?: string
}

export function Settings({ user, onLogout, onUserUpdate }: SettingsProps) {
  const [emailNotifications, setEmailNotifications] = useState(
    () => localStorage.getItem(NOTIFICATIONS_KEY) !== 'false',
  )
  const [profile, setProfile] = useState<PersistedProfile>(() => {
    return {
      fullName: user.fullName,
      photoUrl: user.profilePhotoUrl || '',
      bio: '',
      phone: '',
    }
  })
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState(false)

  const toggleNotifications = () => {
    setEmailNotifications(prev => {
      const next = !prev
      localStorage.setItem(NOTIFICATIONS_KEY, String(next))
      return next
    })
  }

  const initials = useMemo(
    () => profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    [profile.fullName],
  )

  const persistProfile = async (next: PersistedProfile) => {
    const result = await updateUserProfile(user.email, {
      fullName: next.fullName,
      profilePhotoUrl: next.photoUrl || '',
      bio: next.bio || '',
      phone: next.phone || '',
    })
    if (!result.ok || !result.data) {
      setSaveMessage(result.error || 'Could not update profile')
      setTimeout(() => setSaveMessage(null), 2000)
      return
    }

    const updatedUser = {
      ...user,
      fullName: result.data.fullName,
      profilePhotoUrl: result.data.profilePhotoUrl || '',
    }
    onUserUpdate(updatedUser)
    setProfile({
      fullName: result.data.fullName,
      photoUrl: result.data.profilePhotoUrl || '',
      bio: result.data.bio || '',
      phone: result.data.phone || '',
    })
    setSaveMessage('Profile updated successfully')
    setTimeout(() => setSaveMessage(null), 2000)
  }

  useEffect(() => {
    getUserProfile(user.email).then(result => {
      if (!result.ok || !result.data) return
      setProfile({
        fullName: result.data.fullName || user.fullName,
        photoUrl: result.data.profilePhotoUrl || user.profilePhotoUrl || '',
        bio: result.data.bio || '',
        phone: result.data.phone || '',
      })
    })
  }, [user.email, user.fullName, user.profilePhotoUrl])

  const saveProfile = async () => {
    if (!profile.fullName.trim()) {
      setSaveMessage('Full name is required')
      setTimeout(() => setSaveMessage(null), 2000)
      return
    }
    await persistProfile({ ...profile, fullName: profile.fullName.trim() })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      const next = { ...profile, photoUrl: dataUrl }
      setPreviewError(false)
      setProfile(next)
      persistProfile(next)
    }
    reader.readAsDataURL(file)
  }

  const hasPhoto = Boolean(profile.photoUrl && !previewError)

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
        <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80 dark:border-slate-700/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6">Profile Studio</h2>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
            <div className="space-y-4">
              <div className="w-44 h-44 rounded-[1.5rem] overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 mx-auto lg:mx-0">
                {hasPhoto ? (
                  <img
                    src={profile.photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-5xl">
                    {initials || 'U'}
                  </div>
                )}
              </div>

              <label className="w-full flex items-center justify-center gap-2 rounded-[1rem] px-4 py-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 text-sm font-bold cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">
                <Upload size={16} />
                Upload photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Photo URL</label>
                <div className="relative">
                  <ImageIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={profile.photoUrl || ''}
                    onChange={(e) => {
                      setPreviewError(false)
                      setProfile(prev => ({ ...prev, photoUrl: e.target.value }))
                    }}
                    onBlur={saveProfile}
                    placeholder="https://..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/60 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="min-w-0 mb-2">
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">{profile.fullName || user.fullName}</p>
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    value={profile.fullName}
                    onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full pl-11 pr-4 py-3.5 rounded-[0.9rem] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 font-medium text-sm"
                  />
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

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Phone</label>
                <input
                  value={profile.phone || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+359..."
                  className="w-full px-4 py-3.5 rounded-[0.9rem] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell people about yourself..."
                  rows={4}
                  className="w-full px-4 py-3.5 rounded-[0.9rem] border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 font-medium text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={saveProfile}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[0.9rem] bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors"
                >
                  <Save size={15} /> Save Profile
                </button>
                {saveMessage && (
                  <p className={cn(
                    'text-sm font-bold inline-flex items-center gap-1.5',
                    saveMessage.includes('success') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                  )}>
                    <CheckCircle2 size={15} /> {saveMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-[2rem] p-8 shadow-sm border border-slate-100/80 dark:border-slate-700/80">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5">Profile Insights</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-[1rem] p-4 border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10">
              <p className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Account Type</p>
              <p className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100 capitalize">{user.role}</p>
            </div>
            <div className="rounded-[1rem] p-4 border border-emerald-100 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Profile Completion</p>
              <p className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100">
                {Math.min(100, [profile.fullName, profile.photoUrl, profile.bio, profile.phone].filter(Boolean).length * 25)}%
              </p>
            </div>
            <div className="rounded-[1rem] p-4 border border-violet-100 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/10">
              <p className="text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">Notifications</p>
              <p className="mt-2 text-xl font-extrabold text-slate-800 dark:text-slate-100">{emailNotifications ? 'On' : 'Off'}</p>
            </div>
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
