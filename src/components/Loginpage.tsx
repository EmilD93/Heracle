import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { cn } from '../utils/cn'
import { loginUser, loginWithGoogle } from '../authStore'
import type { UserAccount } from '../authStore'
import { useGoogleLogin } from '@react-oauth/google'

interface LoginPageProps {
  onLogin: (user: UserAccount) => void
  onNavigateToRegister: () => void
}

const PREVIEW_EVENTS = [
  { emoji: '🎓', title: 'Fall Orientation', time: 'Sep 1 · 9:00 AM', color: 'from-blue-500 to-indigo-500' },
  { emoji: '🏀', title: 'Season Opener', time: 'Sep 14 · 7:00 PM', color: 'from-orange-400 to-rose-500' },
  { emoji: '🎨', title: 'Art Exhibition', time: 'Sep 20 · 10:00 AM', color: 'from-violet-500 to-purple-600' },
  { emoji: '💻', title: 'Hackathon 2026', time: 'Oct 4 · 8:00 AM', color: 'from-emerald-500 to-teal-600' },
]

export function LoginPage({ onLogin, onNavigateToRegister }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [loginError, setLoginError] = useState<string | null>(null)

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoginError(null)
      setIsLoading(true)
      const result = await loginWithGoogle(tokenResponse.access_token)
      setIsLoading(false)
      if (!result.ok) {
        setLoginError(result.error)
        return
      }
      onLogin(result.user)
    },
    onError: (error) => {
      console.error('Google Login Failed:', error)
      setLoginError('Google Login Failed.')
    }
  })

  const validate = () => {
    const e: { email?: string; password?: string } = {}
    if (!email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoginError(null)
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = await loginUser(email, password)
    setIsLoading(false)
    if (!result.ok) {
      setLoginError(result.error)
      return
    }
    onLogin(result.user)
  }

  return (
    <div className="h-screen overflow-hidden w-full flex bg-[#f1f5f9] font-sans">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 flex-col p-12 shrink-0">
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Ambient glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3.5 mb-auto">
          <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap size={23} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="brand-wordmark-light text-xl">StudentLink</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-auto mb-10">
          <p className="text-blue-400 font-bold text-sm tracking-widest uppercase mb-4">Your campus, your events</p>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Everything<br />happening<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">around you.</span>
          </h2>
          <p className="mt-5 text-slate-400 font-medium text-[15px] leading-relaxed max-w-xs">
            Register for events, track your schedule, and stay connected with your campus community.
          </p>
        </div>

        {/* Floating event chips */}
        <div className="relative z-10 flex flex-col gap-3">
          {PREVIEW_EVENTS.map((ev, i) => (
            <motion.div
              key={ev.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3.5 bg-white/[0.06] border border-white/10 rounded-[1.1rem] px-4 py-3 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <div className={`w-9 h-9 rounded-[0.75rem] bg-gradient-to-br ${ev.color} flex items-center justify-center text-base shrink-0 shadow-sm`}>
                {ev.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{ev.title}</p>
                <p className="text-slate-400 text-xs font-medium">{ev.time}</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        {/* Subtle bg blobs for right side */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="w-full max-w-[380px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-[1rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/25">
              <GraduationCap size={21} strokeWidth={2.5} className="text-white" />
            </div>
            <span className="brand-wordmark text-xl">StudentLink</span>
          </div>

          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1.5">Sign in</h1>
          <p className="text-slate-500 font-medium text-[15px] mb-9">
            Welcome back — let's pick up where you left off.
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-[0.9rem] px-4 py-3 text-sm font-semibold text-red-600"
              >
                {loginError}
              </motion.div>
            )}
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })) }}
                  placeholder="you@university.edu"
                  className={cn(
                    'w-full pl-11 pr-4 py-3.5 rounded-[0.9rem] border bg-white text-slate-800 placeholder-slate-400 font-medium text-sm outline-none transition-all duration-200 shadow-sm',
                    errors.email
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                  )}
                />
              </div>
              {errors.email && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs font-semibold text-red-500">{errors.email}</motion.p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })) }}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-11 pr-12 py-3.5 rounded-[0.9rem] border bg-white text-slate-800 placeholder-slate-400 font-medium text-sm outline-none transition-all duration-200 shadow-sm',
                    errors.password
                      ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                      : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                  )}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-1.5 text-xs font-semibold text-red-500">{errors.password}</motion.p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full mt-1 py-3.5 rounded-[0.9rem] font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-md cursor-pointer',
                isLoading
                  ? 'bg-blue-400 text-white/80 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25 hover:shadow-blue-500/35 hover:from-blue-600 hover:to-indigo-700'
              )}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight size={15} strokeWidth={2.5} /></>
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Google */}
          <button type="button" onClick={() => googleLogin()} className="w-full py-3.5 rounded-[0.9rem] border border-slate-200 bg-white text-slate-700 font-semibold text-sm flex items-center justify-center gap-2.5 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-sm text-slate-500 font-medium mt-7">
            New to Campus?{' '}
            <button type="button" onClick={onNavigateToRegister}
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
              Create an account
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}