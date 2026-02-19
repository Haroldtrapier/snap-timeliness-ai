import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import 'dotenv/config'

import authRoutes from './routes/auth'
import casesRoutes from './routes/cases'
import documentsRoutes from './routes/documents'
import eligibilityRoutes from './routes/eligibility'
import reportsRoutes from './routes/reports'
import usersRoutes from './routes/users'
import { errorHandler, notFound } from './middleware/errorHandler'

const app = express()

// Security headers
app.use(helmet())

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://snap-ai.cumberlandcountync.gov']
    : ['http://localhost:3000'],
  credentials: true,
}))

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'snap-ai-api', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/cases', casesRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/eligibility', eligibilityRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/users', usersRoutes)

// 404 + error handling
app.use(notFound)
app.use(errorHandler)

export default app
