// Simple localStorage-based auth store for the frontend demo.
// In production this would be replaced by real API calls.

export interface UserAccount {
  fullName: string
  email: string
  password: string
  role: 'student' | 'organizer'
}

const STORAGE_KEY = 'heracle_users'

function getUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveUsers(users: UserAccount[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export function registerUser(user: UserAccount): { ok: true } | { ok: false; error: string } {
  const users = getUsers()
  if (users.some(u => u.email.toLowerCase() === user.email.toLowerCase())) {
    return { ok: false, error: 'An account with this email already exists' }
  }
  users.push(user)
  saveUsers(users)
  return { ok: true }
}

export function loginUser(email: string, password: string): { ok: true; user: UserAccount } | { ok: false; error: string } {
  const users = getUsers()
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (!user) {
    return { ok: false, error: 'No account found with this email' }
  }
  if (user.password !== password) {
    return { ok: false, error: 'Incorrect password' }
  }
  return { ok: true, user }
}
