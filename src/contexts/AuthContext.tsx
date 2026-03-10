import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (userData: User) => void
  signOut: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const AUTH_KEY = 'casa-gastos-auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY)
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
    localStorage.setItem(AUTH_KEY, JSON.stringify(userData))
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem(AUTH_KEY)
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signOut,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
