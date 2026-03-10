import { AuthContext, useAuthProvider, type ReactNode } from '../hooks/useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthProvider()

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}
