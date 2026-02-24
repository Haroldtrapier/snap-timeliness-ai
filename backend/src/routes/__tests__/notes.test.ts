/**
 * Notes route tests
 *
 * Prisma and the auth middleware are both mocked so no database or JWT is
 * required. A real Express server is spun up on a random port; requests are
 * made with the built-in Node fetch (Node ≥ 18).
 */

// ---------------------------------------------------------------------------
// Mocks — declared before any module imports
// ---------------------------------------------------------------------------

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    caseNote: {
      findMany:   jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
      delete:     jest.fn(),
    },
    snapCase: {
      findUnique: jest.fn(),
    },
  },
}))

// Use jest.fn() so individual tests can override via mockImplementationOnce
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'w@test.com', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' }
    next()
  }),
}))

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import express from 'express'
import { createServer, Server } from 'http'
import prisma from '../../config/database'
import { authenticate } from '../../middleware/auth'
import notesRouter from '../notes'

// ---------------------------------------------------------------------------
// Test server lifecycle
// ---------------------------------------------------------------------------

let server: Server
let port: number
const CASE_ID = 'case-abc-123'

beforeAll(done => {
  const app = express()
  app.use(express.json())
  app.use('/cases/:caseId/notes', notesRouter)
  server = createServer(app)
  server.listen(0, () => {
    port = (server.address() as { port: number }).port
    done()
  })
})

afterAll(done => { server.close(done) })
beforeEach(() => jest.clearAllMocks())

// Re-apply the default auth mock after clearAllMocks resets it
beforeEach(() => {
  ;(authenticate as jest.Mock).mockImplementation((req: any, _res: any, next: any) => {
    req.user = { id: 'user-1', email: 'w@test.com', role: 'ELIGIBILITY_WORKER', county: 'Cumberland' }
    next()
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const url = (suffix = '') =>
  `http://localhost:${port}/cases/${CASE_ID}/notes${suffix}`

const NOTE = {
  id: 'note-1',
  caseId: CASE_ID,
  authorId: 'user-1',
  body: 'Test note body',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  author: { id: 'user-1', firstName: 'James', lastName: 'Williams', role: 'ELIGIBILITY_WORKER' },
}

// ---------------------------------------------------------------------------
// GET /cases/:caseId/notes
// ---------------------------------------------------------------------------

describe('GET /cases/:caseId/notes', () => {
  it('returns 200 with the list of notes', async () => {
    ;(prisma.caseNote.findMany as jest.Mock).mockResolvedValue([NOTE])

    const res = await fetch(url())
    const body = await res.json() as unknown[]

    expect(res.status).toBe(200)
    expect(Array.isArray(body)).toBe(true)
    expect((body[0] as { id: string }).id).toBe('note-1')
  })

  it('returns an empty array when no notes exist', async () => {
    ;(prisma.caseNote.findMany as jest.Mock).mockResolvedValue([])

    const res = await fetch(url())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('filters by caseId from the URL param', async () => {
    ;(prisma.caseNote.findMany as jest.Mock).mockResolvedValue([])

    await fetch(url())

    expect(prisma.caseNote.findMany as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { caseId: CASE_ID } }),
    )
  })
})

// ---------------------------------------------------------------------------
// POST /cases/:caseId/notes
// ---------------------------------------------------------------------------

describe('POST /cases/:caseId/notes', () => {
  const post = (body: unknown) =>
    fetch(url(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

  it('returns 201 with the created note', async () => {
    ;(prisma.snapCase.findUnique as jest.Mock).mockResolvedValue({ id: CASE_ID })
    ;(prisma.caseNote.create as jest.Mock).mockResolvedValue(NOTE)

    const res = await post({ body: 'Test note body' })
    const data = await res.json() as { id: string }

    expect(res.status).toBe(201)
    expect(data.id).toBe('note-1')
  })

  it('returns 404 when the case does not exist', async () => {
    ;(prisma.snapCase.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await post({ body: 'Hello' })
    expect(res.status).toBe(404)
  })

  it('returns 400 for an empty body string', async () => {
    const res = await post({ body: '' })
    expect(res.status).toBe(400)
  })

  it('returns 400 when body field is missing', async () => {
    const res = await post({})
    expect(res.status).toBe(400)
  })

  it('returns 400 when body exceeds 2000 characters', async () => {
    const res = await post({ body: 'a'.repeat(2001) })
    expect(res.status).toBe(400)
  })

  it('persists the authenticated user as authorId', async () => {
    ;(prisma.snapCase.findUnique as jest.Mock).mockResolvedValue({ id: CASE_ID })
    ;(prisma.caseNote.create as jest.Mock).mockResolvedValue(NOTE)

    await post({ body: 'Some note' })

    expect(prisma.caseNote.create as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ authorId: 'user-1', caseId: CASE_ID }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// DELETE /cases/:caseId/notes/:noteId
// ---------------------------------------------------------------------------

describe('DELETE /cases/:caseId/notes/:noteId', () => {
  const del = (noteId: string) =>
    fetch(url(`/${noteId}`), { method: 'DELETE' })

  it('returns 204 when the author deletes their own note', async () => {
    ;(prisma.caseNote.findUnique as jest.Mock).mockResolvedValue(NOTE)
    ;(prisma.caseNote.delete as jest.Mock).mockResolvedValue(NOTE)

    const res = await del('note-1')
    expect(res.status).toBe(204)
  })

  it('returns 404 when the note does not exist', async () => {
    ;(prisma.caseNote.findUnique as jest.Mock).mockResolvedValue(null)

    const res = await del('nonexistent')
    expect(res.status).toBe(404)
  })

  it('returns 403 when a worker tries to delete another user\'s note', async () => {
    ;(prisma.caseNote.findUnique as jest.Mock).mockResolvedValue({
      ...NOTE, authorId: 'different-user',
    })

    const res = await del('note-1')
    expect(res.status).toBe(403)
  })

  it('returns 204 when an ADMIN deletes another user\'s note', async () => {
    ;(prisma.caseNote.findUnique as jest.Mock).mockResolvedValue({
      ...NOTE, authorId: 'different-user',
    })
    ;(prisma.caseNote.delete as jest.Mock).mockResolvedValue(NOTE)

    // Inject an ADMIN for this one request
    ;(authenticate as jest.Mock).mockImplementationOnce((req: any, _res: any, next: any) => {
      req.user = { id: 'admin-1', email: 'admin@test.com', role: 'ADMIN', county: 'Cumberland' }
      next()
    })

    const res = await del('note-1')
    expect(res.status).toBe(204)
  })
})
