import { encrypt, decrypt, maskSsn } from '../encryption'

const TEST_KEY = 'a'.repeat(64) // 32-byte hex key for testing

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY
})

afterEach(() => {
  delete process.env.ENCRYPTION_KEY
})

// ---------------------------------------------------------------------------
// encrypt / decrypt round-trip
// ---------------------------------------------------------------------------

describe('encrypt + decrypt', () => {
  it('round-trips a plain SSN', () => {
    const ssn = '123-45-6789'
    const ciphertext = encrypt(ssn)
    expect(decrypt(ciphertext)).toBe(ssn)
  })

  it('round-trips an empty string', () => {
    const ciphertext = encrypt('')
    expect(decrypt(ciphertext)).toBe('')
  })

  it('produces different ciphertext on each call (random IV)', () => {
    const ssn = '999-88-7777'
    expect(encrypt(ssn)).not.toBe(encrypt(ssn))
  })

  it('stored format contains three colon-separated hex segments', () => {
    const parts = encrypt('111-22-3333').split(':')
    expect(parts).toHaveLength(3)
    // Each part must be a valid hex string
    parts.forEach(p => expect(p).toMatch(/^[0-9a-f]+$/))
  })
})

// ---------------------------------------------------------------------------
// decrypt — invalid inputs
// ---------------------------------------------------------------------------

describe('decrypt — invalid inputs', () => {
  it('returns null for a plain string (not encrypted)', () => {
    expect(decrypt('hello')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(decrypt('')).toBeNull()
  })

  it('returns null for two-segment garbage', () => {
    expect(decrypt('aabb:ccdd')).toBeNull()
  })

  it('returns null when auth tag is tampered', () => {
    const enc = encrypt('secret')
    const [iv, , cipher] = enc.split(':')
    const tampered = [iv, 'ff'.repeat(16), cipher].join(':')
    expect(decrypt(tampered)).toBeNull()
  })

  it('returns null when ciphertext is tampered', () => {
    const enc = encrypt('secret')
    const [iv, tag] = enc.split(':')
    const tampered = [iv, tag, 'deadbeef'.repeat(4)].join(':')
    expect(decrypt(tampered)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// maskSsn
// ---------------------------------------------------------------------------

describe('maskSsn', () => {
  it('masks an encrypted SSN showing last 4 digits', () => {
    const stored = encrypt('123-45-6789')
    expect(maskSsn(stored)).toBe('***-**-6789')
  })

  it('falls back gracefully on a plain-text SSN (legacy data)', () => {
    expect(maskSsn('123-45-6789')).toBe('***-**-6789')
  })

  it('extracts last 4 digits regardless of dashes', () => {
    expect(maskSsn('000001234')).toBe('***-**-1234')
  })
})

// ---------------------------------------------------------------------------
// missing ENCRYPTION_KEY
// ---------------------------------------------------------------------------

describe('missing ENCRYPTION_KEY', () => {
  beforeEach(() => delete process.env.ENCRYPTION_KEY)

  it('encrypt throws when ENCRYPTION_KEY is not set', () => {
    expect(() => encrypt('test')).toThrow('ENCRYPTION_KEY')
  })

  it('decrypt throws when ENCRYPTION_KEY is not set', () => {
    // decrypt calls getKey() on a correctly-formatted string
    expect(() => decrypt('aa'.repeat(12) + ':' + 'bb'.repeat(16) + ':' + 'cc'.repeat(4))).toThrow('ENCRYPTION_KEY')
  })
})

// ---------------------------------------------------------------------------
// wrong key length
// ---------------------------------------------------------------------------

describe('wrong ENCRYPTION_KEY length', () => {
  it('throws when key is shorter than 32 bytes', () => {
    process.env.ENCRYPTION_KEY = 'abcd'
    expect(() => encrypt('test')).toThrow()
  })
})
