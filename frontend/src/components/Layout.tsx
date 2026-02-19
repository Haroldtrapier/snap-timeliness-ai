import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, BarChart3, Calculator,
  LogOut, Menu, X, Bell, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import type { User } from '../types'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/cases', label: 'Cases', icon: FolderOpen },
  { path: '/eligibility-checker', label: 'Eligibility Check', icon: Calculator },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
]

interface LayoutProps {
  user: User | null
  onLogout: () => void
  children: React.ReactNode
}

export default function Layout({ user, onLogout, children }: LayoutProps) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-green-700">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-snap-green font-black text-sm">S</span>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none">SNAP-AI</div>
          <div className="text-green-300 text-xs">Cumberland County DSS</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(path)
                ? 'bg-white/20 text-white'
                : 'text-green-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Icon size={18} />
            {label}
            {isActive(path) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-4 border-t border-green-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-medium truncate">{user.firstName} {user.lastName}</div>
              <div className="text-green-300 text-xs capitalize">{user.role.replace(/_/g, ' ').toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-green-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-60 flex-shrink-0 flex-col bg-snap-green">
        <SidebarContent />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-60 bg-snap-green">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Breadcrumb */}
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-gray-900">
              {NAV.find(n => isActive(n.path))?.label ?? 'SNAP-AI'}
            </h1>
          </div>

          <button className="relative text-gray-500 hover:text-gray-700">
            <Bell size={20} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
