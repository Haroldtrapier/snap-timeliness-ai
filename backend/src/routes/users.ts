import { Router, Response } from 'express'
import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import prisma from '../config/database'
import { authenticate, requireRole } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'

const router = Router()
router.use(authenticate)

// GET /api/users — list all workers (supervisors/admins only)
router.get('/', requireRole('SUPERVISOR', 'ADMIN'), async (_req: AuthenticatedRequest, res: Response) => {
  const users = await prisma.user.findMany({
    where: { isActive: true },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      role: true, county: true, createdAt: true,
      _count: { select: { assignedCases: { where: { status: { in: ['PENDING_REVIEW', 'IN_REVIEW', 'PENDING_VERIFICATION'] } } } } },
    },
    orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
  })
  res.json(users)
})

// POST /api/users — create a new worker account (admin only)
router.post(
  '/',
  requireRole('ADMIN'),
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('role').isIn(['ELIGIBILITY_WORKER', 'SUPERVISOR', 'ADMIN']),
    body('county').trim().notEmpty(),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { email, password, firstName, lastName, role, county } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      res.status(409).json({ error: 'Email already registered' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, passwordHash, firstName, lastName, role, county },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, county: true },
    })

    res.status(201).json(user)
  }
)

// PATCH /api/users/:id/deactivate — deactivate a user (admin only)
router.patch('/:id/deactivate', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  if (req.params.id === req.user!.id) {
    res.status(400).json({ error: 'Cannot deactivate your own account' })
    return
  }
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } })
  res.json({ message: 'User deactivated' })
})

export default router
