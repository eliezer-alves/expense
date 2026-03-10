import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Receipt, Settings, Upload, LogOut, Menu, X, ChevronDown
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const location = useLocation()

  const isAdminActive = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <Menu size={22} className="text-gray-700" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Casa MCMV</h1>
        {user && (
          <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
        )}
      </header>

      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out
        lg:static lg:translate-x-0 lg:z-auto flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-gray-800">Casa MCMV</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
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
                ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
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
                ${isAdminActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
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
                      ${isActive ? 'text-indigo-700 bg-indigo-50/50 font-medium' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                    `}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* User section */}
        {user && (
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">{user.email}</p>
              </div>
              <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600" title="Sair">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-h-screen pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 flex">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              flex-1 flex flex-col items-center py-2 text-xs font-medium transition-colors
              ${isActive ? 'text-indigo-600' : 'text-gray-400'}
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
            ${isActive || location.pathname.startsWith('/admin') ? 'text-indigo-600' : 'text-gray-400'}
          `}
        >
          <Settings size={20} />
          <span className="mt-0.5">Admin</span>
        </NavLink>
      </nav>
    </div>
  )
}
