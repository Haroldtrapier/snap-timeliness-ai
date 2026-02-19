/**
 * AI Service — Claude-powered document analysis and eligibility assistance.
 * Uses Anthropic SDK for document extraction and AI screening.
 */

import Anthropic from '@anthropic-ai/sdk'
import { DocumentExtractionResult } from '../types'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-opus-4-6'

/**
 * Analyze a document and extract relevant SNAP application fields.
 * In production this would include actual file content/OCR text.
 */
export async function extractDocumentData(
  documentText: string,
  documentType: string
): Promise<DocumentExtractionResult> {
  const prompt = `You are a SNAP (Supplemental Nutrition Assistance Program) document processor for a county Department of Social Services.

Document Type: ${documentType}

Document Content:
${documentText}

Extract all relevant information from this document for SNAP eligibility determination. Return a JSON object with:
1. "extractedFields": key-value pairs of extracted data (names, dates, amounts, employer info, etc.)
2. "confidence": a number 0-1 indicating your confidence in the extraction accuracy
3. "flaggedIssues": array of strings describing any problems, inconsistencies, or missing required information
4. "requiresHumanReview": boolean — true if the document has issues that need manual review
5. "documentType": the confirmed document type

Be precise with dollar amounts and dates. Flag any documents that appear altered, inconsistent, or incomplete.

Respond with valid JSON only.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected AI response type')
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON')
  }

  return JSON.parse(jsonMatch[0]) as DocumentExtractionResult
}

/**
 * AI pre-screening: analyze a complete application and provide
 * an eligibility confidence score and key observations.
 */
export async function screenApplication(applicationData: {
  householdSize: number
  monthlyGrossIncome: number
  assets: number
  hasElderly: boolean
  hasDisabled: boolean
  isHomeless: boolean
  documentsSummary: string
}): Promise<{ score: number; notes: string; redFlags: string[] }> {
  const prompt = `You are a SNAP eligibility pre-screener. Analyze this application and provide an AI confidence score.

Application Data:
- Household size: ${applicationData.householdSize}
- Monthly gross income: $${applicationData.monthlyGrossIncome}
- Assets: $${applicationData.assets}
- Elderly member: ${applicationData.hasElderly}
- Disabled member: ${applicationData.hasDisabled}
- Homeless: ${applicationData.isHomeless}
- Documents provided: ${applicationData.documentsSummary}

The 2025 SNAP gross income limit for a ${applicationData.householdSize}-person household is approximately $${Math.round(1255 + (applicationData.householdSize - 1) * 449)} × 1.3.

Provide a JSON response with:
1. "score": 0-100 confidence that this application will be approved (100 = very likely eligible)
2. "notes": brief summary of key eligibility factors (2-3 sentences)
3. "redFlags": array of concerns that need verification before approval

Respond with valid JSON only.`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected AI response type')
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Could not parse AI response as JSON')
  }

  return JSON.parse(jsonMatch[0]) as { score: number; notes: string; redFlags: string[] }
}

/**
 * Generate a plain-language denial reason explanation for the applicant.
 */
export async function generateDenialExplanation(
  reasons: string[],
  householdSize: number,
  language: string = 'English'
): Promise<string> {
  const prompt = `You are a SNAP caseworker writing a denial notice for an applicant.

Denial reasons:
${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Household size: ${householdSize}

Write a clear, compassionate denial explanation in ${language} that:
1. States the application was denied
2. Explains the specific reason(s) in plain language (no jargon)
3. Mentions the right to appeal within 90 days
4. Suggests other assistance programs they may qualify for (food banks, WIC, TANF)

Keep it under 200 words and use simple language (8th grade reading level).`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    throw new Error('Unexpected AI response type')
  }

  return content.text
}

/**
 * Classify a document image/text into a SNAP document category.
 */
export async function classifyDocument(documentText: string): Promise<{
  type: string
  confidence: number
}> {
  const prompt = `Classify this document into one of these SNAP document categories:
- IDENTITY (driver's license, state ID, birth certificate, passport)
- INCOME_PAYSTUB (pay stub, wage statement)
- INCOME_TAX_RETURN (1040, W-2, 1099)
- INCOME_SELF_EMPLOYMENT (profit/loss statement, business records)
- RESIDENCY_UTILITY (utility bill, water bill)
- RESIDENCY_LEASE (lease agreement, rental agreement)
- ASSETS_BANK_STATEMENT (bank statement, savings account)
- CITIZENSHIP (birth certificate, naturalization certificate, passport)
- IMMIGRATION (green card, visa, EAD)
- EXPENSES_MEDICAL (medical bills, pharmacy receipts)
- EXPENSES_CHILDCARE (childcare receipts, daycare invoices)
- OTHER (anything else)

Document text:
${documentText.slice(0, 500)}

Respond with JSON: {"type": "CATEGORY", "confidence": 0.0-1.0}`

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 100,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') {
    return { type: 'OTHER', confidence: 0 }
  }

  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return { type: 'OTHER', confidence: 0 }
  }

  return JSON.parse(jsonMatch[0]) as { type: string; confidence: number }
}
