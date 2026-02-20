import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ToastProvider } from './components/Toast'
import Layout from './components/Layout'
import LoginPage from './pages/Login'
import DashboardPage from './pages/Dashboard'
import CasesPage from './pages/Cases'
import CaseDetailPage from './pages/CaseDetail'
import NewCasePage from './pages/NewCase'
import ReportsPage from './pages/Reports'
import EligibilityCheckerPage from './pages/EligibilityChecker'
import UsersPage from './pages/Users'
import ForgotPasswordPage from './pages/ForgotPassword'
import ResetPasswordPage from './pages/ResetPassword'
import type { User } from './types'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored) as User)
  }, [])

  const handleLogin = (u: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/cases" element={<CasesPage />} />
                    <Route path="/cases/new" element={<NewCasePage />} />
                    <Route path="/cases/:id" element={<CaseDetailPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/eligibility-checker" element={<EligibilityCheckerPage />} />
                    <Route path="/users" element={<UsersPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}
