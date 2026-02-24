import { useState } from 'react'
import { Lock, User } from 'lucide-react'
import { authApi } from '../services/api'
import { useToast } from '../components/Toast'

function currentUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null') } catch { return null }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const user = currentUser()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (next.length < 8) { setError('New password must be at least 8 characters'); return }
    if (next !== confirm) { setError('New passwords do not match'); return }
    if (next === current) { setError('New password must differ from current password'); return }

    setLoading(true)
    try {
      await authApi.changePassword(current, next)
      toast('Password updated successfully')
      setCurrent(''); setNext(''); setConfirm('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(msg ?? 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile and security</p>
      </div>

      {/* Profile */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={16} className="text-snap-green" /> Profile
        </h2>
        {user && (
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-snap-green flex items-center justify-center text-white text-lg font-bold shrink-0">
              {user.firstName[0]}{user.lastName[0]}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              <div className="text-xs text-gray-400 mt-0.5 capitalize">
                {user.role.replace(/_/g, ' ').toLowerCase()} — {user.county} County
              </div>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-400">
          Name, email, and role can only be changed by an administrator via Staff Management.
        </p>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock size={16} className="text-snap-green" /> Change Password
        </h2>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input
              type="password"
              required
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input
              type="password"
              required
              value={next}
              onChange={e => setNext(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-snap-green focus:outline-none focus:ring-1 focus:ring-snap-green"
              placeholder="••••••••"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button type="submit" disabled={loading} className="btn-primary">
              <Lock size={15} />
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
