import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Receipt, Settings, Upload, LogOut, Menu, X, ChevronDown, Sun, Moon
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/lancamentos', label: 'Lancamentos', icon: Receipt },
  { to: '/importar', label: 'Importar', icon: Upload },
]

const adminItems = [
  { to: '/admin/categorias', label: 'Categorias' },
  { to: '/admin/parceiros', label: 'Parceiros' },
]

export default function AppLayout() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const location = useLocation()

  const isAdminActive = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu size={22} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-base font-bold text-gray-800 dark:text-gray-100">Casa MCMV</h1>
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-gray-500" />}
          </button>
          {user && (
            <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          )}
        </div>
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-100">Casa MCMV</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <X size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'}
              `}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          {/* Admin submenu */}
          <div>
            <button
              onClick={() => setAdminOpen(!adminOpen)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                ${isAdminActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'}
              `}
            >
              <Settings size={18} />
              <span className="flex-1 text-left">Admin</span>
              <ChevronDown size={14} className={`transition-transform ${adminOpen || isAdminActive ? 'rotate-180' : ''}`} />
            </button>
            {(adminOpen || isAdminActive) && (
              <div className="ml-9 mt-1 space-y-0.5">
                {adminItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      block px-3 py-2 rounded-lg text-sm transition-colors
                      ${isActive
                        ? 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-900/20 font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Theme toggle + User section */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="hidden lg:flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-1"
          >
            {theme === 'dark' ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} />}
            {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
          </button>

          {user && (
            <div className="flex items-center gap-3 px-3 py-2">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
              </div>
              <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-30 flex">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors
              ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
            `}
          >
            <item.icon size={20} />
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}
        <NavLink
          to="/admin/categorias"
          className={({ isActive }) => `
            flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors
            ${isActive || location.pathname.startsWith('/admin') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}
          `}
        >
          <Settings size={20} />
          <span className="mt-0.5">Admin</span>
        </NavLink>
      </nav>
    </div>
  )
}
