import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/features/auth'
import { ThemeProvider } from '@/shared/hooks/useTheme'
import { DataLoader } from '@/shared/components/DataLoader'
import AppLayout from '@/shared/components/AppLayout'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { ExpenseList } from '@/features/expenses'
import { CategoriesPage } from '@/features/categories'
import { PartnersPage } from '@/features/partners'
import { ImportPage } from '@/features/import'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <DataLoader>
              <AppLayout />
            </DataLoader>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/lancamentos" element={<ExpenseList />} />
        <Route path="/admin/categorias" element={<CategoriesPage />} />
        <Route path="/admin/parceiros" element={<PartnersPage />} />
        <Route path="/importar" element={<ImportPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
