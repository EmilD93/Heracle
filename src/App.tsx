import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { EventDetails } from './components/EventDetails'
import { OrganizerDashboard } from './components/OrganizerDashboard'
import { MyEvents } from './components/MyEvents'
import { CreateEventForm } from './components/CreateEventForm'
import { CalendarView } from './components/CalendarView'
import { Settings } from './components/Settings'
import { LoginPage } from './components/Loginpage.tsx'
import { RegisterPage } from './components/RegisterPage'
import { useScreenInit } from './useScreenInit.js'
import { initializeDataStore, syncWithBackend } from './dataStore'
import type { UserAccount } from './authStore'
import { clearAuth } from './authStore'
import { applyTheme, getInitialTheme } from './theme'
import type { Theme } from './theme'

// Initialize the data store with seed data on first load
initializeDataStore()

type AuthScreen = 'login' | 'register' | 'app'

export function App() {
  const screenInit = useScreenInit()
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('heracle_user')
    return saved ? JSON.parse(saved) : null
  })
  const [activeTab, setActiveTab] = useState<string>(
    screenInit?.activeTab ?? 'dashboard',
  )
  const [selectedEventId, setSelectedEventId] = useState<string | null>(
    screenInit?.selectedEventId != null ? String(screenInit.selectedEventId) : null,
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }

  const [editingEventId, setEditingEventId] = useState<string | null>(null)

  // Force re-render key — incremented when data changes (e.g. new event created, registration)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  // Events sync status — drives the loading/error states shown on the Dashboard
  const [eventsStatus, setEventsStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const fetchEvents = React.useCallback(() => {
    syncWithBackend().then(ok => {
      setEventsStatus(ok ? 'ready' : 'error')
      refresh()
    })
  }, [])

  // Retry handler for the Dashboard's error state — re-enters the loading state first
  const loadEvents = () => {
    setEventsStatus('loading')
    fetchEvents()
  }

  React.useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedEventId(null)
    if (tab !== 'create-event') setEditingEventId(null)
  }

  const goToEventDetails = (id: string) => {
    setActiveTab('dashboard')
    setSelectedEventId(id)
  }

  const handleLogin = (user: UserAccount) => {
    // JWT вече е записан от authStore.loginUser()
    // Тук само обновяваме UI state-а
    setCurrentUser(user)
    setAuthScreen('app')
  }

  const handleRegister = (user: UserAccount) => {
    // JWT вече е записан от authStore.registerUser()
    setCurrentUser(user)
    setAuthScreen('app')
  }

  const handleLogout = () => {
    // Изтрива JWT + heracle_user от localStorage
    clearAuth()
    setCurrentUser(null)
    setAuthScreen('login')
    setActiveTab('dashboard')
    setSelectedEventId(null)
    setEditingEventId(null)
  }

  // Auto skip login if already logged in
  React.useEffect(() => {
    if (currentUser && authScreen === 'login') {
      setAuthScreen('app')
    }
  }, [currentUser])

  if (authScreen === 'login') {
    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToRegister={() => setAuthScreen('register')}
      />
    )
  }

  if (authScreen === 'register') {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onNavigateToLogin={() => setAuthScreen('login')}
      />
    )
  }

  const userEmail = currentUser?.email ?? ''

  return (
    <div className="flex h-screen w-full bg-[#f1f5f9] dark:bg-slate-950 p-4 gap-4 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        userName={currentUser?.fullName ?? 'Guest'}
        userRole={currentUser?.role ?? 'student'}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 dark:border-slate-800/60 shadow-sm overflow-clip relative flex flex-col transition-colors duration-300">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 dark:from-blue-500/10 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && !selectedEventId && (
              <Dashboard
                key={`dashboard-${refreshKey}`}
                userEmail={userEmail}
                onEventSelect={setSelectedEventId}
                onDataChange={refresh}
                isLoading={eventsStatus === 'loading'}
                loadError={eventsStatus === 'error'}
                onRetry={loadEvents}
              />
            )}
            {activeTab === 'dashboard' && selectedEventId && (
              <EventDetails
                key={`details-${selectedEventId}-${refreshKey}`}
                eventId={selectedEventId}
                userEmail={userEmail}
                onBack={() => setSelectedEventId(null)}
                onDataChange={refresh}
              />
            )}
            {activeTab === 'organizer' && (
              <OrganizerDashboard 
                key={`organizer-${refreshKey}`} 
                setActiveTab={handleTabChange} 
                onDataChange={refresh}
                onEditEvent={(id) => { setEditingEventId(String(id)); handleTabChange('create-event') }}
              />
            )}
            {activeTab === 'my-events' && (
              <MyEvents key={`my-events-${refreshKey}`} userEmail={userEmail} />
            )}
            {activeTab === 'create-event' && (
              <CreateEventForm
                key={`create-event-${editingEventId || 'new'}`}
                userEmail={userEmail}
                eventIdToEdit={editingEventId ?? undefined}
                onBack={() => { setEditingEventId(null); refresh(); handleTabChange('organizer') }}
              />
            )}
            {activeTab === 'calendar' && (
              <CalendarView key={`calendar-${refreshKey}`} onEventSelect={goToEventDetails} />
            )}
            {activeTab === 'settings' && currentUser && (
              <Settings key="settings" user={currentUser} onLogout={handleLogout} />
            )}
            {activeTab !== 'dashboard' &&
              activeTab !== 'organizer' &&
              activeTab !== 'my-events' &&
              activeTab !== 'create-event' &&
              activeTab !== 'calendar' &&
              activeTab !== 'settings' && (
              <div
                key="construction"
                className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 flex-col gap-5"
              >
                <div className="w-20 h-20 rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                  <span className="text-3xl">🚧</span>
                </div>
                <p className="font-bold text-xl text-slate-500 dark:text-slate-400">
                  This section is under construction
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}