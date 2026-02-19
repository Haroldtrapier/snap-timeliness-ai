/**
 * Document Processing Service
 * Handles file validation, storage, and processing pipeline.
 */

import fs from 'fs'
import path from 'path'
import prisma from '../config/database'
import { extractDocumentData, classifyDocument } from './aiService'

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/tiff']
const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB ?? '10')) * 1024 * 1024

export function validateFile(file: Express.Multer.File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return 'File type not allowed. Upload PDF, JPEG, PNG, or TIFF files.'
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB ?? 10}MB.`
  }
  return null
}

/**
 * Process an uploaded document:
 * 1. Validate the file
 * 2. Classify document type (AI)
 * 3. Extract data fields (AI)
 * 4. Update database record
 */
export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc) throw new Error(`Document ${documentId} not found`)

  await prisma.document.update({
    where: { id: documentId },
    data: { status: 'PROCESSING' },
  })

  try {
    // In production, this would run OCR on the actual file.
    // For now, we read any text content or use filename as context.
    let documentText = `Document: ${doc.originalName}\nType hint: ${doc.type}`

    if (doc.mimeType === 'text/plain') {
      const filePath = path.resolve(doc.filePath)
      if (fs.existsSync(filePath)) {
        documentText = fs.readFileSync(filePath, 'utf-8')
      }
    }

    // Classify document type if it's OTHER
    let confirmedType = doc.type
    if (doc.type === 'OTHER') {
      const classification = await classifyDocument(documentText)
      if (classification.confidence >= 0.7) {
        confirmedType = classification.type as typeof doc.type
      }
    }

    // Extract data
    const extracted = await extractDocumentData(documentText, confirmedType)

    await prisma.document.update({
      where: { id: documentId },
      data: {
        type: confirmedType,
        status: extracted.requiresHumanReview ? 'PENDING' : 'VERIFIED',
        aiExtractedData: extracted.extractedFields,
        aiConfidence: extracted.confidence,
        processedAt: new Date(),
        reviewerNotes: extracted.flaggedIssues.length > 0
          ? extracted.flaggedIssues.join('; ')
          : null,
      },
    })
  } catch (err) {
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PENDING', reviewerNotes: `Processing error: ${(err as Error).message}` },
    })
    throw err
  }
}

/**
 * Get a summary of documents uploaded for a case.
 */
export async function getDocumentSummary(caseId: string): Promise<string> {
  const docs = await prisma.document.findMany({ where: { caseId } })
  if (docs.length === 0) return 'No documents uploaded'

  const summary = docs.map(d => `${d.type} (${d.status})`).join(', ')
  return `${docs.length} document(s): ${summary}`
}
