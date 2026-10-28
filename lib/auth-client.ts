import { createAuthClient } from 'better-auth/react'

// Same origin as the page: no baseURL needed
export const authClient = createAuthClient()
