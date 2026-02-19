import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — redirect to login
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: import('../types').User }>('/auth/login', { email, password }),
  me: () => api.get<import('../types').User>('/auth/me'),
}

export const casesApi = {
  list: (params?: Record<string, string>) =>
    api.get<{ cases: import('../types').SnapCase[]; total: number; pages: number }>('/cases', { params }),
  get: (id: string) => api.get<import('../types').SnapCase>(`/cases/${id}`),
  create: (data: Record<string, unknown>) => api.post<{ case: import('../types').SnapCase; eligibility: unknown }>('/cases', data),
  assign: (id: string, workerId: string) => api.patch(`/cases/${id}/assign`, { workerId }),
  decision: (id: string, data: { decision: string; denialReason?: string; notes?: string }) =>
    api.patch(`/cases/${id}/decision`, data),
  aiScreen: (id: string) => api.post(`/cases/${id}/ai-screen`),
  stats: () => api.get<import('../types').DashboardStats>('/cases/stats/overview'),
}

export const documentsApi = {
  upload: (caseId: string, file: File, documentType: string) => {
    const form = new FormData()
    form.append('file', file)
    form.append('documentType', documentType)
    return api.post(`/documents/upload/${caseId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  listForCase: (caseId: string) => api.get<import('../types').Document[]>(`/documents/case/${caseId}`),
  verify: (id: string, status: string, notes?: string) =>
    api.patch(`/documents/${id}/verify`, { status, reviewerNotes: notes }),
}

export const eligibilityApi = {
  check: (data: Record<string, unknown>) => api.post('/eligibility/check', data),
  guidelines: () => api.get('/eligibility/guidelines'),
}

export const usersApi = {
  list: () => api.get<import('../types').User[]>('/users'),
  create: (data: Record<string, string>) => api.post('/users', data),
  deactivate: (id: string) => api.patch(`/users/${id}/deactivate`),
}

export const reportsApi = {
  timeliness: () => api.get<import('../types').TimelinessReport>('/reports/timeliness'),
  workload: () => api.get('/reports/workload'),
  trends: () => api.get('/reports/processing-trends'),
  pipeline: () => api.get('/reports/pipeline'),
}

export default api
