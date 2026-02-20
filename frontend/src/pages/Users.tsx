import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, UserX, ShieldCheck, User as UserIcon, Users } from 'lucide-react'
import { usersApi } from '../services/api'
import { useToast } from '../components/Toast'
import type { User } from '../types'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  SUPERVISOR: 'Supervisor',
  ELIGIBILITY_WORKER: 'Eligibility Worker',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800',
  SUPERVISOR: 'bg-blue-100 text-blue-800',
  ELIGIBILITY_WORKER: 'bg-gray-100 text-gray-700',
}

function currentUser(): User | null {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null') as User } catch { return null }
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { toast } = useToast()
  const me = currentUser()
  const isAdmin = me?.role === 'ADMIN'

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '',
    role: 'ELIGIBILITY_WORKER', county: 'Cumberland',
  })
  const [formError, setFormError] = useState('')

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast('User created successfully')
      setShowForm(false)
      setForm({ email: '', password: '', firstName: '', lastName: '', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' })
      setFormError('')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setFormError(msg ?? 'Failed to create user')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => usersApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast('User deactivated')
    },
    onError: () => toast('Failed to deactivate user', 'error'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    if (!form.email || !form.password || !form.firstName || !form.lastName) {
      setFormError('All fields are required')
      return
    }
    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }
    createMutation.mutate()
  }

  const admins = users.filter((u: User) => u.role === 'ADMIN')
  const supervisors = users.filter((u: User) => u.role === 'SUPERVISOR')
  const workers = users.filter((u: User) => u.role === 'ELIGIBILITY_WORKER')

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-snap-green" /> Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} active staff member{users.length !== 1 ? 's' : ''}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(v => !v)}
            className="btn-primary"
          >
            <UserPlus size={16} />
            {showForm ? 'Cancel' : 'Add Staff'}
          </button>
        )}
      </div>

      {/* New user form */}
      {showForm && isAdmin && (
        <div className="card border border-snap-green/30">
          <h2 className="font-semibold text-gray-900 mb-4">New Staff Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                  placeholder="Smith"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                placeholder="jsmith@cumberland-dss.nc.gov"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                placeholder="Min. 8 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                >
                  <option value="ELIGIBILITY_WORKER">Eligibility Worker</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">County</label>
                <input
                  type="text"
                  value={form.county}
                  onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-snap-green"
                  placeholder="Cumberland"
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary">
                <UserPlus size={15} />
                {createMutation.isPending ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Loading staff...</div>
      ) : (
        <div className="space-y-6">
          {[
            { title: 'Administrators', icon: ShieldCheck, color: 'text-purple-600', list: admins },
            { title: 'Supervisors', icon: ShieldCheck, color: 'text-blue-600', list: supervisors },
            { title: 'Eligibility Workers', icon: UserIcon, color: 'text-gray-500', list: workers },
          ].map(({ title, icon: Icon, color, list }) =>
            list.length > 0 && (
              <div key={title}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Icon size={14} className={color} /> {title} ({list.length})
                </h2>
                <div className="card p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Email</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Role</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">County</th>
                        <th className="text-left px-5 py-3 font-medium text-gray-500">Active Cases</th>
                        {isAdmin && <th className="px-5 py-3" />}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {list.map((u: User) => (
                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3 font-medium text-gray-900">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-snap-green flex items-center justify-center text-white text-xs font-semibold shrink-0">
                                {u.firstName[0]}{u.lastName[0]}
                              </div>
                              {u.firstName} {u.lastName}
                              {u.id === me?.id && (
                                <span className="text-xs text-gray-400">(you)</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{u.email}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                              {ROLE_LABELS[u.role]}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-600">{u.county}</td>
                          <td className="px-5 py-3 text-gray-600">
                            {u._count?.assignedCases ?? 0}
                          </td>
                          {isAdmin && (
                            <td className="px-5 py-3 text-right">
                              {u.id !== me?.id && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Deactivate ${u.firstName} ${u.lastName}? They will lose access immediately.`)) {
                                      deactivateMutation.mutate(u.id)
                                    }
                                  }}
                                  className="text-gray-300 hover:text-red-500 transition-colors"
                                  title="Deactivate user"
                                >
                                  <UserX size={15} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
}
