import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, ArrowRight, Check, Briefcase } from 'lucide-react'
import { cn } from '../utils/cn'
import { registerUser } from '../authStore'
import type { UserAccount } from '../authStore'

interface RegisterPageProps {
  onRegister: (user: UserAccount) => void
  onNavigateToLogin: () => void
}

interface FormState {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  role: 'student' | 'organizer'
}

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const PASSWORD_RULES = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'A number', test: (p: string) => /\d/.test(p) },
]

const STEPS = ['Account type', 'Your details', 'Set password']

export function RegisterPage({ onRegister, onNavigateToLogin }: RegisterPageProps) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [agreed, setAgreed] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key in errors) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validateStep = (s: number): FormErrors => {
    const e: FormErrors = {}
    if (s === 1) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required'
      if (!form.email) e.email = 'Email is required'
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email'
    }
    if (s === 2) {
      if (!form.password) e.password = 'Password is required'
      else if (!PASSWORD_RULES.every(r => r.test(form.password))) e.password = 'Does not meet all requirements'
      if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
      else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    }
    return e
  }

  const next = () => {
    const errs = validateStep(step)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (step < 2) { next(); return }
    const errs = validateStep(2)
    if (Object.keys(errs).length) { setErrors(errs); return }
    if (!agreed) return
    setRegisterError(null)
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const result = await registerUser({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role,
    })
    setIsLoading(false)
    if (!result.ok) {
      setRegisterError(result.error)
      return
    }
    onRegister(result.user)
  }

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(form.password)).length

  return (
    <div className="min-h-screen w-full flex bg-[#f1f5f9] font-sans">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-950 flex-col p-12 shrink-0">
        {/* Dot grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots2" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots2)" />
        </svg>

        {/* Glows */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3.5 mb-auto">
          <div className="w-11 h-11 rounded-[1.1rem] bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap size={23} strokeWidth={2.5} className="text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">Campus</span>
        </div>

        {/* Headline */}
        <div className="relative z-10 mt-auto mb-12">
          <p className="text-indigo-400 font-bold text-sm tracking-widest uppercase mb-4">Join the community</p>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
            Start your<br />campus<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">journey.</span>
          </h2>
          <p className="mt-5 text-slate-400 font-medium text-[15px] leading-relaxed max-w-xs">
            Discover events, connect with organizers, and make the most of your time on campus.
          </p>
        </div>

        {/* Progress steps visual */}
        <div className="relative z-10 space-y-3">
          {STEPS.map((label, i) => {
            const done = step > i
            const active = step === i
            return (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.45, ease: 'easeOut' }}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-[1.1rem] border transition-all duration-300',
                  active
                    ? 'bg-white/10 border-white/20 backdrop-blur-sm'
                    : done
                      ? 'bg-white/[0.04] border-white/8'
                      : 'bg-transparent border-transparent opacity-50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-300',
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-500/30'
                      : 'bg-white/10 text-slate-500'
                )}>
                  {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </div>
                <span className={cn(
                  'font-semibold text-sm',
                  active ? 'text-white' : done ? 'text-slate-300' : 'text-slate-600'
                )}>
                  {label}
                </span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-400/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/8 rounded-full blur-3xl pointer-events-none" />

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
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Campus</span>
          </div>

          {/* Step indicator (mobile) */}
          <div className="flex items-center gap-1.5 mb-6 lg:hidden">
            {STEPS.map((_, i) => (
              <div key={i} className={cn(
                'h-1 rounded-full transition-all duration-300',
                i <= step ? 'bg-blue-500' : 'bg-slate-200',
                i === step ? 'flex-[2]' : 'flex-1'
              )} />
            ))}
          </div>

          {/* Desktop step label */}
          <div className="hidden lg:flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i} className={cn(
                  'h-1 rounded-full transition-all duration-300',
                  i <= step ? 'bg-blue-500' : 'bg-slate-200',
                  i === step ? 'w-6' : 'w-3'
                )} />
              ))}
            </div>
            <span className="text-xs font-bold text-slate-400 ml-1">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {registerError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-[0.9rem] px-4 py-3 text-sm font-semibold text-red-600 mb-4"
              >
                {registerError}
              </motion.div>
            )}
            <AnimatedStep show={step === 0}>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1.5">Create account</h1>
              <p className="text-slate-500 font-medium text-[15px] mb-8">How will you use Campus?</p>

              <div className="space-y-3">
                {(['student', 'organizer'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setField('role', r)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-[1.1rem] border-2 text-left transition-all duration-200 cursor-pointer',
                      form.role === r
                        ? 'border-blue-500 bg-blue-50/80 shadow-sm shadow-blue-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className={cn(
                      'w-11 h-11 rounded-[0.9rem] flex items-center justify-center shrink-0 transition-all duration-200',
                      form.role === r
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-100 text-slate-500'
                    )}>
                      {r === 'student'
                        ? <GraduationCap size={21} strokeWidth={2.5} />
                        : <Briefcase size={21} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <p className={cn('font-bold text-sm capitalize', form.role === r ? 'text-blue-700' : 'text-slate-700')}>
                        {r}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {r === 'student'
                          ? 'Browse and register for campus events'
                          : 'Create and manage events for your org'}
                      </p>
                    </div>
                    <div className={cn(
                      'ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200',
                      form.role === r ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    )}>
                      {form.role === r && <Check size={10} strokeWidth={3.5} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                className="w-full mt-6 py-3.5 rounded-[0.9rem] font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer"
              >
                Continue <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </AnimatedStep>

            <AnimatedStep show={step === 1}>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1.5">Your details</h1>
              <p className="text-slate-500 font-medium text-[15px] mb-8">Tell us a little about yourself.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={e => setField('fullName', e.target.value)}
                      placeholder="Alex Johnson"
                      className={cn(
                        'w-full pl-11 pr-4 py-3.5 rounded-[0.9rem] border bg-white text-slate-800 placeholder-slate-400 font-medium text-sm outline-none transition-all duration-200 shadow-sm',
                        errors.fullName
                          ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                      )}
                    />
                  </div>
                  {errors.fullName && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-semibold text-red-500">{errors.fullName}</motion.p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
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
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(0)}
                  className="flex-1 py-3.5 rounded-[0.9rem] border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                  Back
                </button>
                <button type="button" onClick={next}
                  className="flex-[2] py-3.5 rounded-[0.9rem] font-bold text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer">
                  Continue <ArrowRight size={15} strokeWidth={2.5} />
                </button>
              </div>
            </AnimatedStep>

            <AnimatedStep show={step === 2}>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1.5">Set password</h1>
              <p className="text-slate-500 font-medium text-[15px] mb-8">Choose something memorable but secure.</p>

              <div className="space-y-4">
                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setField('password', e.target.value)}
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

                  {/* Strength */}
                  {form.password.length > 0 && (
                    <div className="mt-2.5">
                      <div className="flex gap-1.5 mb-2">
                        {[0, 1, 2].map(i => (
                          <div key={i} className={cn(
                            'flex-1 h-1 rounded-full transition-all duration-300',
                            i < passwordStrength
                              ? passwordStrength === 1 ? 'bg-red-400' : passwordStrength === 2 ? 'bg-amber-400' : 'bg-emerald-500'
                              : 'bg-slate-200'
                          )} />
                        ))}
                      </div>
                      <div className="flex gap-3 flex-wrap">
                        {PASSWORD_RULES.map(rule => (
                          <span key={rule.label} className={cn(
                            'flex items-center gap-1 text-xs font-semibold transition-colors duration-200',
                            rule.test(form.password) ? 'text-emerald-600' : 'text-slate-400'
                          )}>
                            <div className={cn(
                              'w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-200',
                              rule.test(form.password) ? 'bg-emerald-500' : 'bg-slate-200'
                            )}>
                              {rule.test(form.password) && <Check size={7} strokeWidth={3.5} className="text-white" />}
                            </div>
                            {rule.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.password && !form.password && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-semibold text-red-500">{errors.password}</motion.p>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={e => setField('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        'w-full pl-11 pr-12 py-3.5 rounded-[0.9rem] border bg-white text-slate-800 placeholder-slate-400 font-medium text-sm outline-none transition-all duration-200 shadow-sm',
                        errors.confirmPassword
                          ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : form.confirmPassword && form.confirmPassword === form.password
                            ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                      )}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs font-semibold text-red-500">{errors.confirmPassword}</motion.p>
                  )}
                </div>

                {/* Terms */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div onClick={() => setAgreed(!agreed)} className={cn(
                    'w-5 h-5 rounded-[5px] border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200 cursor-pointer',
                    agreed ? 'bg-blue-500 border-blue-500' : 'border-slate-300 group-hover:border-blue-300'
                  )}>
                    {agreed && <Check size={10} strokeWidth={3.5} className="text-white" />}
                  </div>
                  <span className="text-sm text-slate-500 font-medium leading-snug">
                    I agree to the{' '}
                    <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Terms</span>
                    {' '}and{' '}
                    <span className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">Privacy Policy</span>
                  </span>
                </label>
              </div>

              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3.5 rounded-[0.9rem] border border-slate-200 bg-white font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
                  Back
                </button>
                <motion.button
                  type="submit"
                  disabled={isLoading || !agreed}
                  whileHover={!isLoading && agreed ? { scale: 1.01 } : {}}
                  whileTap={!isLoading && agreed ? { scale: 0.98 } : {}}
                  className={cn(
                    'flex-[2] py-3.5 rounded-[0.9rem] font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200',
                    isLoading || !agreed
                      ? 'bg-blue-300 text-white/80 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25 hover:from-blue-600 hover:to-indigo-700 cursor-pointer'
                  )}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating…
                    </>
                  ) : (
                    <>Create account <ArrowRight size={15} strokeWidth={2.5} /></>
                  )}
                </motion.button>
              </div>
            </AnimatedStep>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium mt-7">
            Already have an account?{' '}
            <button type="button" onClick={onNavigateToLogin}
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}

// Animated step wrapper — avoids importing AnimatePresence at top level just for this
function AnimatedStep({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}