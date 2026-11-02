// Readable cookie that only says "a leader is logged in on this browser": the Better Auth session
// cookie is HttpOnly. proxy.ts sets it on the Tabù pages, SiteAccount reads it so that the public
// pages (static) ask who is logged in only when there is one, never for anonymous visitors.
export const LEADER_HINT_COOKIE = 'tabu_leader'
