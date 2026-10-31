import { z } from 'zod'

// Shared zod fields for the Tabù forms

// Free text: trimmed, at most `max` characters. Browsers submit textarea newlines as \r\n.
export const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Massimo ${max} caratteri.`)
    .transform(v => v.replace(/\r\n?/g, '\n'))

// The same, saved as null when empty
export const optionalText = (max: number) => text(max).transform(v => v || null)
