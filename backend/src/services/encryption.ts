import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) {
    throw new Error('ENCRYPTION_KEY env var is not set')
  }
  const buf = Buffer.from(raw, 'hex')
  if (buf.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 64 hex chars (32 bytes), got ${buf.length} bytes`)
  }
  return buf
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a colon-separated string: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return [iv.toString('hex'), tag.toString('hex'), encrypted.toString('hex')].join(':')
}

/**
 * Decrypts a value produced by `encrypt()`.
 * Returns null if the input is not in the expected format or decryption fails.
 */
export function decrypt(value: string): string | null {
  const parts = value.split(':')
  if (parts.length !== 3) return null

  try {
    const key = getKey()
    const iv = Buffer.from(parts[0], 'hex')
    const tag = Buffer.from(parts[1], 'hex')
    const ciphertext = Buffer.from(parts[2], 'hex')

    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) return null

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

/**
 * Returns the last-4 masked form of an SSN: ***-**-XXXX
 * Handles both encrypted storage values and plain-text SSNs (fallback).
 */
export function maskSsn(stored: string): string {
  const plaintext = decrypt(stored) ?? stored  // fallback: treat as unencrypted
  const digits = plaintext.replace(/\D/g, '')
  const last4 = digits.slice(-4)
  return `***-**-${last4}`
}
