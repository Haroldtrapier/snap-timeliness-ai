/**
 * Users route tests
 *
 * Prisma, bcrypt, and the auth middleware are all mocked so no real database
 * or hashing is needed. A real Express server is spun up on a random port;
 * requests are made with Node's built-in fetch (Node ≥ 18).
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any module imports
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
}))

// Use jest.fn() so individual tests can override via mockImplementationOnce
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN', county: 'Cumberland' }
    next()
  }),
  requireRole: jest.fn((...roles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import express from 'express'
import { createServer, Server } from 'http'
import bcrypt from 'bcryptjs'
import prisma from '../../config/database'
import { authenticate } from '../../middleware/auth'
import usersRouter from '../users'

// ---------------------------------------------------------------------------
// Test server lifecycle
// ---------------------------------------------------------------------------

let server: Server
let port: number

const BASE_USER = {
  id: 'user-2',
  email: 'worker@test.com',
  firstName: 'Jane',
  lastName: 'Smith',
  role: 'ELIGIBILITY_WORKER',
  county: 'Cumberland',
  isActive: true,
  _count: { assignedCases: 3 },
}

beforeAll(done => {
  const app = express()
  app.use(express.json())
  app.use('/users', usersRouter)
  server = createServer(app)
  server.listen(0, () => {
    port = (server.address() as { port: number }).port
    done()
  })
})

afterAll(done => { server.close(done) })
beforeEach(() => jest.clearAllMocks())

// Re-apply default authenticate and requireRole mocks after clearAllMocks
beforeEach(() => {
  ;(authenticate as jest.Mock).mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN', county: 'Cumberland' }
    next()
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (suffix = '') => `http://localhost:${port}/users${suffix}`

const post = (body: unknown) =>
  fetch(url(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const patch = (suffix: string) =>
  fetch(url(suffix), { method: 'PATCH', headers: { 'Content-Type': 'application/json' } })

const asWorker = (req: any, _res: any, next: any) => {
  req.user = { id: 'worker-1', email: 'worker@test.com', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' }
  next()
}

const asSupervisor = (req: any, _res: any, next: any) => {
  req.user = { id: 'sup-1', email: 'sup@test.com', role: 'SUPERVISOR', county: 'Cumberland' }
  next()
}

// ---------------------------------------------------------------------------
// GET /users
// ---------------------------------------------------------------------------

describe('GET /users', () => {
  it('returns 200 with user list for ADMIN', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([BASE_USER])

    const res = await fetch(url())
    const data = await res.json() as unknown[]

    expect(res.status).toBe(200)
    expect(Array.isArray(data)).toBe(true)
    expect((data[0] as { id: string }).id).toBe('user-2')
  })

  it('returns 200 with user list for SUPERVISOR', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asSupervisor)
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([BASE_USER])

    const res = await fetch(url())
    expect(res.status).toBe(200)
  })

  it('returns 403 for ELIGIBILITY_WORKER', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asWorker)

    const res = await fetch(url())
    expect(res.status).toBe(403)
  })

  it('returns an empty array when no users exist', async () => {
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue([])

    const res = await fetch(url())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// POST /users
// ---------------------------------------------------------------------------

describe('POST /users', () => {
  const validUser = {
    email: 'new@test.com',
    password: 'securepassword',
    firstName: 'New',
    lastName: 'Worker',
    role: 'ELIGIBILITY_WORKER',
    county: 'Cumberland',
  }

  it('returns 201 with created user for ADMIN', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null) // no existing user
    ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new-user', ...validUser })

    const res = await post(validUser)
    const data = await res.json() as { id: string }

    expect(res.status).toBe(201)
    expect(data.id).toBe('new-user')
  })

  it('hashes the password before storing', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.user.create as jest.Mock).mockResolvedValue({ id: 'new-user', ...validUser })

    await post(validUser)

    expect(bcrypt.hash as jest.Mock).toHaveBeenCalledWith('securepassword', 12)
    expect(prisma.user.create as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: '$2b$12$hashedpassword' }),
      })
    )
  })

  it('returns 403 for SUPERVISOR', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asSupervisor)

    const res = await post(validUser)
    expect(res.status).toBe(403)
  })

  it('returns 403 for ELIGIBILITY_WORKER', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asWorker)

    const res = await post(validUser)
    expect(res.status).toBe(403)
  })

  it('returns 409 when email is already registered', async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(BASE_USER) // email exists

    const res = await post(validUser)
    expect(res.status).toBe(409)
  })

  it('returns 400 for invalid email format', async () => {
    const res = await post({ ...validUser, email: 'not-an-email' })
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid role', async () => {
    const res = await post({ ...validUser, role: 'SUPERADMIN' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is too short', async () => {
    const res = await post({ ...validUser, password: 'short' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await post({ email: 'test@test.com' })
    expect(res.status).toBe(400)
  })
})

// ---------------------------------------------------------------------------
// PATCH /users/:id/deactivate
// ---------------------------------------------------------------------------

describe('PATCH /users/:id/deactivate', () => {
  it('returns 200 when ADMIN deactivates another user', async () => {
    ;(prisma.user.update as jest.Mock).mockResolvedValue({ ...BASE_USER, isActive: false })

    const res = await patch('/user-2/deactivate')
    expect(res.status).toBe(200)
  })

  it('returns 400 when ADMIN tries to deactivate their own account', async () => {
    // The admin's own id is 'admin-1'
    const res = await patch('/admin-1/deactivate')
    expect(res.status).toBe(400)
  })

  it('returns 403 for SUPERVISOR', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asSupervisor)

    const res = await patch('/user-2/deactivate')
    expect(res.status).toBe(403)
  })

  it('returns 403 for ELIGIBILITY_WORKER', async () => {
    ;(authenticate as jest.Mock).mockImplementationOnce(asWorker)

    const res = await patch('/user-2/deactivate')
    expect(res.status).toBe(403)
  })
})
