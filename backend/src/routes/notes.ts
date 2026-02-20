import { Router, Response } from 'express'
import { body, validationResult } from 'express-validator'
import prisma from '../config/database'
import { authenticate } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'

const router = Router({ mergeParams: true }) // mergeParams exposes :caseId from parent
router.use(authenticate)

// GET /api/cases/:caseId/notes
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { caseId } = req.params

  const notes = await prisma.caseNote.findMany({
    where: { caseId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  })

  res.json(notes)
})

// POST /api/cases/:caseId/notes
router.post(
  '/',
  [body('body').trim().isLength({ min: 1, max: 2000 })],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { caseId } = req.params

    // Verify case exists
    const exists = await prisma.snapCase.findUnique({ where: { id: caseId }, select: { id: true } })
    if (!exists) {
      res.status(404).json({ error: 'Case not found' })
      return
    }

    const note = await prisma.caseNote.create({
      data: {
        caseId,
        authorId: req.user!.id,
        body: req.body.body,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    })

    res.status(201).json(note)
  }
)

// DELETE /api/cases/:caseId/notes/:noteId — author or admin only
router.delete('/:noteId', async (req: AuthenticatedRequest, res: Response) => {
  const { noteId } = req.params
  const note = await prisma.caseNote.findUnique({ where: { id: noteId } })

  if (!note) {
    res.status(404).json({ error: 'Note not found' })
    return
  }

  const isAuthor = note.authorId === req.user!.id
  const isAdmin = req.user!.role === 'ADMIN'

  if (!isAuthor && !isAdmin) {
    res.status(403).json({ error: 'Only the note author or an admin can delete this note' })
    return
  }

  await prisma.caseNote.delete({ where: { id: noteId } })
  res.status(204).send()
})

export default router
