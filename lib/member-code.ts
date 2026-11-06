// The member code is the key of staff_member (db/schema.ts). Who is in the staff without a real
// AGESCI code (e.g. a religious assistant not in the census) gets a placeholder: its own member
// row, with no birthday. Real codes are digits only (lib/members-csv.ts), so they never collide.

const PREFIX = 'X-'

export const placeholderCode = (slug: string) => `${PREFIX}${slug}`

export const isPlaceholderCode = (code: string) => code.startsWith(PREFIX)
