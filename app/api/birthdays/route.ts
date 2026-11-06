import { getMemberBirthdays } from '@/lib/data'
import { romeToday, upcomingBirthdays } from '@/lib/birthdays'

// Prerendered and regenerated at most once an hour (the day changes at midnight in Rome), each
// time reading only the members with a birthday in the next days
export const dynamic = 'force-static'
export const revalidate = 3600

const DAYS = 7

export async function GET() {
  const today = romeToday()
  const members = await getMemberBirthdays(today, DAYS)
  return Response.json(upcomingBirthdays(members, today, DAYS))
}
