import { api } from '@/api/client'

export type Session = { email: string; authenticated: true }

export async function getSession(): Promise<Session | null> {
  try {
    const response = await api.get<{ email: string; authenticated: boolean }>('/auth/session')
    return response.data.authenticated ? { email: response.data.email.toLowerCase(), authenticated: true } : null
  } catch {
    return null
  }
}

export function getStoredSessionEmail(): string | null {
  try {
    const raw = localStorage.getItem('kurio-session-v2')
    const parsed = raw ? JSON.parse(raw) as { email?: string } : null
    return typeof parsed?.email === 'string' ? parsed.email.toLowerCase() : null
  } catch {
    return null
  }
}
