import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import prisma from '../config/database'
import { authenticate } from '../middleware/auth'
import { AuthenticatedRequest } from '../types'
import { validateFile, processDocument } from '../services/documentProcessor'

const router = Router()
router.use(authenticate)

const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB ?? '10')) * 1024 * 1024 },
})

// POST /api/documents/upload/:caseId
router.post('/upload/:caseId', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' })
    return
  }

  const validationError = validateFile(req.file)
  if (validationError) {
    fs.unlinkSync(req.file.path)
    res.status(400).json({ error: validationError })
    return
  }

  const snapCase = await prisma.snapCase.findUnique({ where: { id: req.params.caseId } })
  if (!snapCase) {
    fs.unlinkSync(req.file.path)
    res.status(404).json({ error: 'Case not found' })
    return
  }

  const document = await prisma.document.create({
    data: {
      caseId: req.params.caseId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      filePath: req.file.path,
      type: (req.body.documentType as 'OTHER') ?? 'OTHER',
      status: 'PENDING',
    },
  })

  // Process asynchronously (don't await — return immediately)
  processDocument(document.id).catch(err =>
    console.error(`Error processing document ${document.id}:`, err)
  )

  res.status(201).json({ document, message: 'Document uploaded and queued for processing' })
})

// GET /api/documents/case/:caseId
router.get('/case/:caseId', async (req: AuthenticatedRequest, res: Response) => {
  const docs = await prisma.document.findMany({
    where: { caseId: req.params.caseId },
    orderBy: { uploadedAt: 'desc' },
  })
  res.json(docs)
})

// GET /api/documents/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } })
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }
  res.json(doc)
})

// PATCH /api/documents/:id/verify
router.patch('/:id/verify', async (req: AuthenticatedRequest, res: Response) => {
  const { status, reviewerNotes } = req.body
  if (!['VERIFIED', 'REJECTED', 'NEEDS_REPLACEMENT'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' })
    return
  }

  const doc = await prisma.document.update({
    where: { id: req.params.id },
    data: { status, reviewerNotes, verifiedAt: new Date() },
  })
  res.json(doc)
})

// DELETE /api/documents/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } })
  if (!doc) {
    res.status(404).json({ error: 'Document not found' })
    return
  }

  if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath)
  await prisma.document.delete({ where: { id: req.params.id } })
  res.json({ message: 'Document deleted' })
})

export default router
