import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
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
          {submitted ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-snap-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                If <span className="font-medium text-gray-700">{email}</span> is registered, you'll receive a password reset link within a few minutes.
              </p>
              <Link to="/login" className="text-sm text-snap-green font-medium hover:underline">
                ← Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Reset your password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter your work email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
                    placeholder="you@cumberland.nc.gov"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center py-2.5"
                >
                  {loading ? 'Sending...' : 'Send reset link'}
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
