/**
 * Auth route tests
 *
 * Prisma, bcrypt, jwt, and emailService are all mocked so no real database,
 * hashing, or SMTP is needed. A real Express server is spun up on a random
 * port; requests are made with Node's built-in fetch (Node ≥ 18).
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any module imports
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(),
}))

jest.mock('../../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

// Stub authenticate for protected routes (GET /me, POST /change-password)
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'worker@test.com', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' }
    next()
  }),
  requireRole: jest.fn((..._roles: string[]) => (_req: any, _res: any, next: any) => next()),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import express from 'express'
import { createServer, Server } from 'http'
import bcrypt from 'bcryptjs'
import prisma from '../../config/database'
import { authenticate } from '../../middleware/auth'
import { sendPasswordResetEmail } from '../../services/emailService'
import authRouter from '../auth'

// ---------------------------------------------------------------------------
// Test server lifecycle
// ---------------------------------------------------------------------------

let server: Server
let port: number

const BASE_USER = {
  id: 'user-1',
  email: 'worker@test.com',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'ELIGIBILITY_WORKER',
  county: 'Cumberland',
  isActive: true,
  passwordHash: '$2b$12$hashedpassword',
  resetToken: null,
  resetTokenExpiresAt: null,
}

beforeAll(done => {
  process.env.JWT_SECRET = 'test-secret'
  const app = express()
  app.use(express.json())
  app.use('/auth', authRouter)
  server = createServer(app)
  server.listen(0, () => {
    port = (server.address() as { port: number }).port
    done()
  })
})

afterAll(done => { server.close(done) })
beforeEach(() => jest.clearAllMocks())

// Re-apply default authenticate mock after clearAllMocks
beforeEach(() => {
  ;(authenticate as jest.Mock).mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'worker@test.com', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' }
    next()
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (path: string) => `http://localhost:${port}/auth${path}`

const post = (path: string, body: unknown) =>
  fetch(url(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------

describe('POST /auth/login', () => {
  it('returns 200 with token and user on valid credentials', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)

    const res = await post('/login', { email: 'worker@test.com', password: 'password123' })
    const data = await res.json() as { token: string; user: { id: string } }

    expect(res.status).toBe(200)
    expect(data.token).toBe('mock-jwt-token')
    expect(data.user.id).toBe('user-1')
  })

  it('returns 401 when user does not exist', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await post('/login', { email: 'nobody@test.com', password: 'password123' })
    expect(res.status).toBe(401)
  })

  it('returns 401 when user is inactive', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...BASE_USER, isActive: false })

    const res = await post('/login', { email: 'worker@test.com', password: 'password123' })
    expect(res.status).toBe(401)
  })

  it('returns 401 when password is wrong', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const res = await post('/login', { email: 'worker@test.com', password: 'wrongpassword' })
    expect(res.status).toBe(401)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await post('/login', { email: 'not-an-email', password: 'password123' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const res = await post('/login', { email: 'worker@test.com', password: 'short' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------

describe('GET /auth/me', () => {
  it('returns 200 with user profile when authenticated', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'worker@test.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'ELIGIBILITY_WORKER',
      county: 'Cumberland',
    })

    const res = await fetch(url('/me'), { headers: { Authorization: 'Bearer mock-token' } })
    const data = await res.json() as { id: string; email: string }

    expect(res.status).toBe(200)
    expect(data.id).toBe('user-1')
    expect(data.email).toBe('worker@test.com')
  })

  it('returns 401 when authenticate rejects the request', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce((_req: any, res: any) => {
      res.status(401).json({ error: 'Missing or invalid authorization header' })
    })

    const res = await fetch(url('/me'))
    expect(res.status).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// POST /auth/change-password
// ---------------------------------------------------------------------------

describe('POST /auth/change-password', () => {
  it('returns 200 on successful password change', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(true)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash')
    ;(prisma.user.update as jest.Mock).mockResolvedValue(BASE_USER)

    const res = await post('/change-password', {
      currentPassword: 'oldpassword1',
      newPassword: 'newpassword1',
    })
    expect(res.status).toBe(200)
  })

  it('returns 401 when current password is incorrect', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.compare as jest.Mock).mockResolvedValue(false)

    const res = await post('/change-password', {
      currentPassword: 'wrongpassword',
      newPassword: 'newpassword1',
    })
    expect(res.status).toBe(401)
  })

  it('returns 400 when new password is too short', async () => {
    const res = await post('/change-password', {
      currentPassword: 'oldpassword1',
      newPassword: 'short',
    })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// ---------------------------------------------------------------------------

describe('POST /auth/forgot-password', () => {
  it('always returns 200 (even for unknown email)', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await post('/forgot-password', { email: 'nobody@test.com' })
    const data = await res.json() as { message: string }

    expect(res.status).toBe(200)
    expect(data.message).toContain('reset link')
  })

  it('stores a hashed reset token and sends email for known active user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER)
    ;(prisma.user.update as jest.Mock).mockResolvedValue(BASE_USER)

    const res = await post('/forgot-password', { email: 'worker@test.com' })
    expect(res.status).toBe(200)

    expect(prisma.user.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resetToken: expect.any(String) }),
      })
    )
    expect(sendPasswordResetEmail as jest.Mock).toHaveBeenCalled()
  })

  it('returns 200 but skips email for inactive user', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...BASE_USER, isActive: false })

    const res = await post('/forgot-password', { email: 'worker@test.com' })
    expect(res.status).toBe(200)
    expect(sendPasswordResetEmail as jest.Mock).not.toHaveBeenCalled()
  })

  it('returns 400 for invalid email format', async () => {
    const res = await post('/forgot-password', { email: 'not-an-email' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// POST /auth/reset-password
// ---------------------------------------------------------------------------

describe('POST /auth/reset-password', () => {
  it('returns 200 on successful password reset', async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash')
    ;(prisma.user.update as jest.Mock).mockResolvedValue(BASE_USER)

    const res = await post('/reset-password', { token: 'valid-raw-token', password: 'newpassword1' })
    const data = await res.json() as { message: string }

    expect(res.status).toBe(200)
    expect(data.message).toContain('sign in')
  })

  it('clears reset token fields after successful reset', async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(BASE_USER)
    ;(bcrypt.hash as jest.Mock).mockResolvedValue('$2b$12$newhash')
    ;(prisma.user.update as jest.Mock).mockResolvedValue(BASE_USER)

    await post('/reset-password', { token: 'valid-raw-token', password: 'newpassword1' })

    expect(prisma.user.update as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ resetToken: null, resetTokenExpiresAt: null }),
      })
    )
  })

  it('returns 400 when token is invalid or expired', async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)

    const res = await post('/reset-password', { token: 'bad-token', password: 'newpassword1' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when new password is too short', async () => {
    const res = await post('/reset-password', { token: 'some-token', password: 'short' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when token is missing', async () => {
    const res = await post('/reset-password', { password: 'newpassword1' })
    expect(res.status).toBe(400)
  })
})
