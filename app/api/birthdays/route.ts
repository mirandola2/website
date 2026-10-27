import { getMemberBirthdays } from '@/lib/data'
import { romeToday, upcomingBirthdays } from '@/lib/birthdays'

// Prerendered and regenerated at most once an hour: the members table is read ~24 times a day
export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const members = await getMemberBirthdays()
  return Response.json(upcomingBirthdays(members, romeToday()))
}
