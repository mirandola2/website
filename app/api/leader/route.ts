import { getNavbarLeader } from '@/lib/dal'

// The logged-in leader for the site navbar (components/SiteAccount.tsx), null otherwise
export async function GET() {
  return Response.json(await getNavbarLeader(), { headers: { 'Cache-Control': 'private, no-store' } })
}
