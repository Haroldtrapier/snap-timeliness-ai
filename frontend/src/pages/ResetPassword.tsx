import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../services/api'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen bg-snap-green flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 font-medium mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-sm text-snap-green font-medium hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-snap-green flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-snap-green font-black text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SNAP-AI</h1>
          <p className="text-green-200 text-sm mt-1">Cumberland County Department of Social Services</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {done ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-snap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-sm text-gray-500">Redirecting you to sign in...</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Choose a new password</h2>
              <p className="text-sm text-gray-500 mb-6">Must be at least 8 characters.</p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    New password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirm new password
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center py-2.5"
                >
                  {loading ? 'Updating...' : 'Set new password'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-snap-green font-medium hover:underline">
                  ← Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
