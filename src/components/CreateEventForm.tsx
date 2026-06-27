import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Tag,
  Clock,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Send,
  Save,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../utils/cn'
import { createEvent } from '../dataStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgendaItem {
  id: string
  time: string
  activity: string
}

interface FormState {
  title: string
  category: string
  date: string
  startTime: string
  endTime: string
  location: string
  capacity: string
  description: string
  imageUrl: string
  agenda: AgendaItem[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'Academic',
  'Sports',
  'Social',
  'Technology',
  'Entertainment',
]

// ─── Field components ─────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-bold text-slate-600 mb-2">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full bg-white/80 border border-slate-200/80 rounded-[1rem] px-4 py-3 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all',
        className,
      )}
    />
  )
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full bg-white/80 border border-slate-200/80 rounded-[1rem] px-4 py-3 text-[15px] font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none',
        className,
      )}
    />
  )
}

function Section({
  icon: Icon,
  title,
  children,
  color = 'blue',
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
  color?: 'blue' | 'emerald' | 'violet' | 'amber'
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet: 'bg-violet-50 text-violet-600',
    amber: 'bg-amber-50 text-amber-600',
  }
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-7 border border-slate-100/80 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className={cn('w-10 h-10 rounded-[0.875rem] flex items-center justify-center shrink-0', colorMap[color])}>
          <Icon size={20} strokeWidth={2.5} />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: 'success' | 'draft' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className={cn(
        'fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 rounded-[1.25rem] shadow-xl font-bold text-[15px] flex items-center gap-2.5',
        type === 'success'
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
          : 'bg-slate-800 text-white',
      )}
    >
      {type === 'success' ? <Send size={17} strokeWidth={2.5} /> : <Save size={17} strokeWidth={2.5} />}
      {message}
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface CreateEventFormProps {
  onBack: () => void
  userEmail: string
  eventIdToEdit?: string
}

export function CreateEventForm({ onBack, userEmail, eventIdToEdit }: CreateEventFormProps) {
  const existingEvent = eventIdToEdit ? getEventById(eventIdToEdit) : null

  // Helper to parse date/time back to form format
  let initDate = ''
  let initStart = ''
  if (existingEvent) {
    const parts = existingEvent.date.split('•')
    if (parts.length > 0) {
      const d = new Date(parts[0].trim())
      if (!isNaN(d.getTime())) initDate = d.toISOString().split('T')[0]
    }
    if (parts.length > 1) {
      const t = parts[1].trim()
      // very basic conversion from "06:45 PM" to "18:45"
      const timeMatch = t.match(/(\d+):(\d+)\s*(AM|PM)/i)
      if (timeMatch) {
        let hrs = parseInt(timeMatch[1], 10)
        const mins = timeMatch[2]
        const ampm = timeMatch[3].toUpperCase()
        if (ampm === 'PM' && hrs < 12) hrs += 12
        if (ampm === 'AM' && hrs === 12) hrs = 0
        initStart = `${hrs.toString().padStart(2, '0')}:${mins}`
      }
    }
  }

  const [form, setForm] = useState<FormState>({
    title: existingEvent?.title || '',
    category: existingEvent?.category || '',
    date: initDate,
    startTime: initStart,
    endTime: '',
    location: existingEvent?.location || '',
    capacity: existingEvent?.capacity ? String(existingEvent.capacity) : '',
    description: existingEvent?.description || '',
    imageUrl: existingEvent?.image || '',
    agenda: existingEvent?.agenda?.length 
      ? existingEvent.agenda.map(a => ({ id: crypto.randomUUID(), time: a.time, activity: a.activity }))
      : [{ id: crypto.randomUUID(), time: '', activity: '' }],
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'draft' } | null>(null)
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const set = (field: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  // Agenda helpers
  const addAgendaItem = () =>
    setForm((f) => ({
      ...f,
      agenda: [...f.agenda, { id: crypto.randomUUID(), time: '', activity: '' }],
    }))

  const removeAgendaItem = (id: string) =>
    setForm((f) => ({ ...f, agenda: f.agenda.filter((a) => a.id !== id) }))

  const updateAgendaItem = (id: string, field: 'time' | 'activity', value: string) =>
    setForm((f) => ({
      ...f,
      agenda: f.agenda.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
    }))

  const validate = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Event name is required'
    if (!form.category) e.category = 'Pick a category'
    if (!form.date) e.date = 'Date is required'
    if (!form.location.trim()) e.location = 'Location is required'
    if (!form.capacity || isNaN(Number(form.capacity))) e.capacity = 'Enter a valid number'
    if (!form.description.trim()) e.description = 'Add a short description'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const showToast = (message: string, type: 'success' | 'draft') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const buildEventData = (status: 'Published' | 'Draft') => {
    const dateFormatted = form.date
      ? new Date(form.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : ''
    const timeStr = form.startTime
      ? `${form.startTime}${form.endTime ? ' – ' + form.endTime : ''}`
      : ''
    const dateDisplay = dateFormatted + (timeStr ? ` • ${timeStr}` : '')

    return {
      title: form.title,
      description: form.description,
      date: dateDisplay,
      image: form.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1000',
      capacity: Number(form.capacity) || 100,
      category: form.category,
      status,
      location: form.location,
      organizer: {
        name: userEmail.split('@')[0],
        email: userEmail,
        phone: '',
      },
      agenda: form.agenda
        .filter(a => a.time || a.activity)
        .map(a => ({ time: a.time, activity: a.activity })),
      createdBy: userEmail,
    }
  }

  const handlePublish = async () => {
    if (!validate()) return
    if (eventIdToEdit) {
      await updateEvent(eventIdToEdit, buildEventData('Published'))
      showToast('Event updated!', 'success')
    } else {
      await createEvent(buildEventData('Published'))
      showToast('Event published!', 'success')
    }
    setTimeout(() => onBack(), 1200)
  }

  const handleSaveDraft = async () => {
    if (eventIdToEdit) {
      await updateEvent(eventIdToEdit, buildEventData('Draft'))
      showToast('Draft updated', 'draft')
    } else {
      await createEvent(buildEventData('Draft'))
      showToast('Saved as draft', 'draft')
    }
    setTimeout(() => onBack(), 1200)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      set('imageUrl', url)
    }
  }

  // Live preview image
  const previewImage = (form.imageUrl.startsWith('http') || form.imageUrl.startsWith('blob:') || form.imageUrl.startsWith('data:')) ? form.imageUrl : null

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex-1 h-full overflow-y-auto px-10 py-8 hide-scrollbar relative z-10"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold transition-colors group"
            >
              <div className="w-10 h-10 rounded-[1rem] bg-white/80 border border-slate-200/80 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-100 transition-all shadow-sm">
                <ArrowLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
              </div>
              Organizer Dashboard
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-5 py-3 bg-white/80 border border-slate-200/80 text-slate-700 rounded-[1.25rem] font-bold text-[14px] hover:bg-slate-50 transition-all shadow-sm focus:outline-none"
            >
              <Save size={17} strokeWidth={2.5} />
              Save draft
            </button>
            <button
              onClick={handlePublish}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-[1.25rem] font-bold text-[14px] shadow-sm hover:shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98] focus:outline-none"
            >
              <Send size={17} strokeWidth={2.5} />
              Publish event
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
              Create New Event
            </h1>
            <p className="text-slate-500 font-semibold text-lg">
              Fill in the details and publish when ready
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 pb-16">
          {/* Left column — main fields */}
          <div className="lg:col-span-2 space-y-7">

            {/* Basic info */}
            <Section icon={FileText} title="Basic Information" color="blue">
              <div className="space-y-5">
                <div>
                  <Label required>Event name</Label>
                  <Input
                    placeholder="e.g. Annual Tech Career Fair"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                  />
                  {errors.title && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.title}</p>}
                </div>

                <div>
                  <Label required>Category</Label>
                  <div className="relative">
                    <button
                      onClick={() => setCategoryOpen((o) => !o)}
                      className={cn(
                        'w-full bg-white/80 border border-slate-200/80 rounded-[1rem] px-4 py-3 text-[15px] font-medium text-left flex items-center justify-between transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
                        !form.category && 'text-slate-400',
                      )}
                    >
                      {form.category || 'Select a category'}
                      <ChevronDown
                        size={18}
                        strokeWidth={2.5}
                        className={cn('text-slate-400 transition-transform duration-200', categoryOpen && 'rotate-180')}
                      />
                    </button>
                    <AnimatePresence>
                      {categoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[1.25rem] border border-slate-100 shadow-xl shadow-slate-900/10 z-20 overflow-hidden max-h-48 overflow-y-auto"
                        >
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              onClick={() => { set('category', cat); setCategoryOpen(false) }}
                              className={cn(
                                'w-full text-left px-5 py-3 text-[15px] font-semibold hover:bg-blue-50 hover:text-blue-600 transition-colors',
                                form.category === cat ? 'text-blue-600 bg-blue-50/60' : 'text-slate-700',
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {errors.category && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.category}</p>}
                </div>

                <div>
                  <Label required>Description</Label>
                  <Textarea
                    placeholder="What is this event about? Who should attend?"
                    rows={4}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                  />
                  {errors.description && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.description}</p>}
                </div>
              </div>
            </Section>

            {/* Date & Time */}
            <Section icon={Clock} title="Date & Time" color="violet">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-3">
                  <Label required>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => set('date', e.target.value)}
                  />
                  {errors.date && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.date}</p>}
                </div>
                <div>
                  <Label>Start time</Label>
                  <Input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => set('startTime', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End time</Label>
                  <Input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => set('endTime', e.target.value)}
                  />
                </div>
              </div>
            </Section>

            {/* Agenda */}
            <Section icon={Calendar} title="Schedule" color="emerald">
              <div className="space-y-3 mb-4">
                {form.agenda.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-50 border-4 border-white shadow-sm shrink-0 mt-0.5" />
                    <Input
                      placeholder="10:00 AM"
                      value={item.time}
                      onChange={(e) => updateAgendaItem(item.id, 'time', e.target.value)}
                      className="w-28 shrink-0"
                    />
                    <Input
                      placeholder="Opening keynote"
                      value={item.activity}
                      onChange={(e) => updateAgendaItem(item.id, 'activity', e.target.value)}
                      className="flex-1"
                    />
                    {form.agenda.length > 1 && (
                      <button
                        onClick={() => removeAgendaItem(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none shrink-0"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addAgendaItem}
                className="flex items-center gap-2 text-[14px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors focus:outline-none"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add schedule item
              </button>
            </Section>
          </div>

          {/* Right column — logistics + image preview */}
          <div className="space-y-7">

            {/* Logistics */}
            <Section icon={MapPin} title="Logistics" color="emerald">
              <div className="space-y-5">
                <div>
                  <Label required>Location</Label>
                  <Input
                    placeholder="e.g. Engineering Hall, Room 201"
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                  />
                  {errors.location && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.location}</p>}
                </div>
                <div>
                  <Label required>Capacity</Label>
                  <div className="relative">
                    <Users size={17} strokeWidth={2.5} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type="number"
                      placeholder="100"
                      min="1"
                      value={form.capacity}
                      onChange={(e) => set('capacity', e.target.value)}
                      className="pl-11"
                    />
                  </div>
                  {errors.capacity && <p className="mt-1.5 text-xs font-bold text-red-500">{errors.capacity}</p>}
                </div>
              </div>
            </Section>

            {/* Cover image */}
            <Section icon={ImageIcon} title="Cover Image" color="amber">
              <div className="space-y-4">
                <div>
                  <Label>Upload Photo</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2.5 file:px-5
                      file:rounded-[1rem] file:border-0
                      file:text-sm file:font-bold
                      file:bg-amber-50 file:text-amber-700
                      hover:file:bg-amber-100 transition-all cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-slate-100"></div>
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">or</span>
                  <div className="flex-1 border-t border-slate-100"></div>
                </div>

                <div>
                  <Label>Image URL</Label>
                  <Input
                    placeholder="https://images.unsplash.com/..."
                    value={form.imageUrl}
                    onChange={(e) => set('imageUrl', e.target.value)}
                  />
                  <p className="mt-2 text-xs font-medium text-slate-400">
                    Paste a direct image link or upload a file to preview below.
                  </p>
                </div>
              </div>

              <div className="mt-5 h-40 rounded-[1.25rem] overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center transition-all">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <span className="text-xs font-bold">No image yet</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Publish card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] p-6 shadow-sm text-white">
              <h3 className="font-extrabold text-lg mb-1">Ready to go live?</h3>
              <p className="text-blue-100 text-sm font-medium mb-5 leading-relaxed">
                Publishing makes the event visible to all students immediately.
              </p>
              <button
                onClick={handlePublish}
                className="w-full py-3.5 bg-white text-blue-600 rounded-[1.25rem] font-bold text-[15px] hover:bg-blue-50 transition-colors shadow-sm focus:outline-none flex items-center justify-center gap-2"
              >
                <Send size={17} strokeWidth={2.5} />
                Publish event
              </button>
              <button
                onClick={handleSaveDraft}
                className="w-full mt-3 py-3 text-blue-100 hover:text-white rounded-[1.25rem] font-bold text-[14px] transition-colors focus:outline-none"
              >
                Save as draft instead
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </>
  )
}