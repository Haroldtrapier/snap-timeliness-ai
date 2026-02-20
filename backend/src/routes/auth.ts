import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { body, validationResult } from 'express-validator'
import prisma from '../config/database'
import { authenticate } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'
import { sendPasswordResetEmail } from '../services/emailService'

const router = Router()

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, county: user.county },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '8h' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        county: user.county,
      },
    })
  }
)

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, county: true },
  })
  res.json(user)
})

// POST /api/auth/change-password
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 8 }),
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { currentPassword, newPassword } = req.body
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      res.status(401).json({ error: 'Current password is incorrect' })
      return
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
    res.json({ message: 'Password updated successfully' })
  }
)

// POST /api/auth/forgot-password
// Always returns 200 to prevent email enumeration
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { email } = req.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (user && user.isActive) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: tokenHash, resetTokenExpiresAt: expiresAt },
      })

      const resetUrl = `${process.env.APP_URL ?? 'http://localhost:3000'}/reset-password?token=${rawToken}`

      await sendPasswordResetEmail({
        to: user.email,
        name: `${user.firstName} ${user.lastName}`,
        resetUrl,
        expiresInMinutes: 60,
      }).catch(err => console.error('Failed to send password reset email:', err))
    }

    // Always respond the same to prevent email enumeration
    res.json({ message: 'If that email is registered, a reset link has been sent.' })
  }
)

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }

    const { token, password } = req.body
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
        isActive: true,
      },
    })

    if (!user) {
      res.status(400).json({ error: 'Reset link is invalid or has expired.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    })

    res.json({ message: 'Password updated successfully. You can now sign in.' })
  }
)

export default router
