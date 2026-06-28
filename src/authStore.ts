export interface UserAccount {
  fullName: string
  email: string
  password: string
  role: 'student' | 'organizer'
}

const API_BASE = '/api'

export async function loginUser(email: string, password: string): Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.detail || 'Login failed' }
    }
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: 'Network error connecting to backend' }
  }
}

export async function registerUser(user: UserAccount & { password?: string }): Promise<{ ok: true; user: UserAccount } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: user.fullName.split(' ')[0],
        lastName: user.fullName.split(' ')[1] || '',
        email: user.email,
        password: user.password || 'password123',
        role: user.role
      })
    })
    const data = await res.json()
    if (!res.ok) {
      return { ok: false, error: data.detail || 'Registration failed' }
    }
    return { ok: true, user: data.user }
  } catch (err) {
    return { ok: false, error: 'Network error connecting to backend' }
  }
}
