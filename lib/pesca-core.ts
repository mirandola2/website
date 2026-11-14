import { createCipheriv, createDecipheriv, hkdfSync, randomBytes, randomInt } from 'crypto'

// The pure part of the pesca (lib/pesca.ts): the draw and the encryption of one row. No database
// and no env here, so it is tested directly (lib/pesca.test.ts).

export const PESCA_SCHEME = 'aes-gcm-v1'

// A uniform random derangement: who gives to whom, nobody to themselves. Fisher–Yates, retried
// until there is no fixed point (about 37% of the shuffles are accepted). Sattolo's algorithm would
// be faster but gives one single cycle only, which tells every participant something about the rest.
export function derange<T>(items: readonly T[], rand: (max: number) => number = randomInt): Map<T, T> {
  if (items.length < 2) throw new Error('A pesca needs at least 2 participants')
  if (new Set(items).size !== items.length) throw new Error('Duplicate participants')
  for (let attempt = 0; attempt < 1000; attempt++) {
    const shuffled = [...items]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = rand(i + 1)
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    if (shuffled.every((item, i) => item !== items[i])) return new Map(items.map((item, i) => [item, shuffled[i]]))
  }
  throw new Error('Could not draw a derangement')
}

// The receiver is padded to a fixed length, so the ciphertext doesn't tell short slugs from long ones
const PLAINTEXT_BYTES = 128
const IV_BYTES = 12
const TAG_BYTES = 16

// PESCA_SECRET: 32 random bytes, base64 (`openssl rand -base64 32`). Never an empty or short key.
export function parseSecret(value: string | undefined) {
  const key = value ? Buffer.from(value, 'base64') : Buffer.alloc(0)
  if (key.length !== 32) throw new Error('PESCA_SECRET must be 32 random bytes in base64 (openssl rand -base64 32)')
  return key
}

// One key per row: a leaked row key opens that row only
function rowKey(secret: Buffer, pescaId: string, giver: string) {
  return Buffer.from(hkdfSync('sha256', secret, pescaId, `pesca|${giver}`, 32))
}

// Ties the ciphertext to its row: moved to another leader's row, it no longer decrypts
const aad = (pescaId: string, giver: string) => Buffer.from(`${pescaId}|${giver}`)

// `giver` and `receiver` are staff slugs: unlike member codes they never change
export function encryptReceiver(secret: Buffer, pescaId: string, giver: string, receiver: string) {
  const bytes = Buffer.from(receiver, 'utf8')
  if (bytes.length === 0 || bytes.length >= PLAINTEXT_BYTES) throw new Error('Receiver out of range')
  const plain = Buffer.alloc(PLAINTEXT_BYTES)
  plain[0] = bytes.length
  bytes.copy(plain, 1)
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', rowKey(secret, pescaId, giver), iv)
  cipher.setAAD(aad(pescaId, giver))
  const ct = Buffer.concat([cipher.update(plain), cipher.final()])
  return Buffer.concat([iv, ct, cipher.getAuthTag()]).toString('base64')
}

// Throws on a wrong key, a tampered payload or a payload of another row
export function decryptReceiver(secret: Buffer, pescaId: string, giver: string, payload: string) {
  const data = Buffer.from(payload, 'base64')
  if (data.length !== IV_BYTES + PLAINTEXT_BYTES + TAG_BYTES) throw new Error('Malformed payload')
  const decipher = createDecipheriv('aes-256-gcm', rowKey(secret, pescaId, giver), data.subarray(0, IV_BYTES))
  decipher.setAAD(aad(pescaId, giver))
  decipher.setAuthTag(data.subarray(IV_BYTES + PLAINTEXT_BYTES))
  const plain = Buffer.concat([decipher.update(data.subarray(IV_BYTES, IV_BYTES + PLAINTEXT_BYTES)), decipher.final()])
  return plain.subarray(1, 1 + plain[0]).toString('utf8')
}
