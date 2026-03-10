import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import type { User } from '@/shared/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (userData: User) => void
  signOut: () => void
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthProvider() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.auth)
      if (stored) {
        setUser(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [])

  const signIn = (userData: User) => {
    setUser(userData)
    localStorage.setItem(STORAGE_KEYS.auth, JSON.stringify(userData))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.auth)
  }

  return {
    user,
    loading,
    signIn,
    signOut,
    isAuthenticated: !!user,
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// Re-export for use in AuthProvider component
export type { AuthContextType, ReactNode }
