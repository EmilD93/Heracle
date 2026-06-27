import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { EventDetails } from './components/EventDetails'
import { OrganizerDashboard } from './components/OrganizerDashboard'
import { MyEvents } from './components/MyEvents'
import { CreateEventForm } from './components/CreateEventForm'
import { LoginPage } from './components/Loginpage.tsx'
import { RegisterPage } from './components/RegisterPage'
import { useScreenInit } from './useScreenInit.js'
import { initializeDataStore } from './dataStore'
import type { UserAccount } from './authStore'

// Initialize the data store with seed data on first load
initializeDataStore()

type AuthScreen = 'login' | 'register' | 'app'

export function App() {
  const screenInit = useScreenInit()
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login')
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [activeTab, setActiveTab] = useState<string>(
    screenInit?.activeTab ?? 'dashboard',
  )
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    screenInit?.selectedEventId ?? null,
  )
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)

  // Force re-render key — incremented when data changes (e.g. new event created, registration)
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = () => setRefreshKey(k => k + 1)

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSelectedEventId(null)
  }

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user)
    setAuthScreen('app')
  }

  const handleRegister = (user: UserAccount) => {
    setCurrentUser(user)
    setAuthScreen('app')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAuthScreen('login')
    setActiveTab('dashboard')
    setSelectedEventId(null)
  }

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
    <div className="flex h-screen w-full bg-[#f1f5f9] p-4 gap-4 font-sans overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        userName={currentUser?.fullName ?? 'Guest'}
        userRole={currentUser?.role ?? 'student'}
        onLogout={handleLogout}
      />

      <main className="flex-1 bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/60 shadow-sm overflow-hidden relative flex flex-col">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 -left-40 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 h-full flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && !selectedEventId && (
              <Dashboard key={`dashboard-${refreshKey}`} userEmail={userEmail} onEventSelect={setSelectedEventId} onDataChange={refresh} />
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
              <OrganizerDashboard key={`organizer-${refreshKey}`} setActiveTab={handleTabChange} />
            )}
            {activeTab === 'my-events' && (
              <MyEvents key={`my-events-${refreshKey}`} userEmail={userEmail} />
            )}
            {activeTab === 'create-event' && (
              <CreateEventForm
                key="create-event"
                userEmail={userEmail}
                onBack={() => { refresh(); handleTabChange('organizer') }}
              />
            )}
            {activeTab !== 'dashboard' && activeTab !== 'organizer' && activeTab !== 'my-events' && activeTab !== 'create-event' && (
              <div
                key="construction"
                className="flex items-center justify-center h-full text-slate-400 flex-col gap-5"
              >
                <div className="w-20 h-20 rounded-[1.5rem] bg-white/80 shadow-sm border border-slate-100 flex items-center justify-center">
                  <span className="text-3xl">🚧</span>
                </div>
                <p className="font-bold text-xl text-slate-500">
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