import { API_BASE } from './config/api'

export interface UserAccount {
  id?: number
  fullName: string
  email: string
  role: 'student' | 'organizer'
}

const TOKEN_KEY = 'heracle_jwt'
const USER_KEY = 'heracle_user'

// ---------------------------------------------------------------------------
// Token helpers — използвай тях навсякъде в app-а
// ---------------------------------------------------------------------------
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/** Връща headers с Authorization bearer token за protected endpoints */
export function authHeaders(): Record<string, string> {
  const token = getToken()
  return token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' }
}

// ---------------------------------------------------------------------------
// Auth API calls
// ---------------------------------------------------------------------------
export async function loginUser(
  email: string,
  password: string,
): Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.detail || 'Login failed' }
    }

    // Запази JWT и потребителя
    saveToken(data.access_token)
    const user: UserAccount = {
      id: data.user.id,
      fullName: data.user.fullName,
      email: data.user.email,
      role: data.user.role,
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    return { ok: true, user }
  } catch {
    return { ok: false, error: 'Network error connecting to backend' }
  }
}

export async function registerUser(
  user: Omit<UserAccount, 'id'> & { password: string },
): Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: user.fullName.split(' ')[0],
        lastName: user.fullName.split(' ').slice(1).join(' ') || '',
        email: user.email,
        password: user.password,
        role: user.role,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.detail || 'Registration failed' }
    }

    // Запази JWT и потребителя — директно влизаме след регистрация
    saveToken(data.access_token)
    const newUser: UserAccount = {
      id: data.user.id,
      fullName: data.user.fullName,
      email: data.user.email,
      role: data.user.role,
    }
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))

    return { ok: true, user: newUser }
  } catch {
    return { ok: false, error: 'Network error connecting to backend' }
  }
}
