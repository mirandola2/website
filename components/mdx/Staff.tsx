import { getStaffMembers, type StaffMember } from '@/lib/data'
import { LC_STAFF } from '@/lib/staff'
import StaffGrid, { type StaffPerson } from './StaffGrid'

interface StaffProps {
  staff: string
  coca?: boolean
  selector?: boolean
}

// Names shown on the site:
// - Coca page: name and surname
// - L/C pages: only the "nome di caccia" (Akela, Bagheera...), to keep the capi anonymous
// - E/G and R/S pages: first name only
function usesHuntName(person: StaffMember, staff: string, coca: boolean) {
  return !coca && LC_STAFF.includes(staff) && !!person.nomeCaccia
}

function displayName(person: StaffMember, staff: string, coca: boolean) {
  if (coca) return person.nome
  if (person.nomeCaccia && usesHuntName(person, staff, coca)) return person.nomeCaccia
  return person.nome.split(' ').slice(0, -1).join(' ') || person.nome
}

const orderKey = (p: StaffMember) => (typeof p.order === 'number' ? p.order : Infinity)

export default async function Staff({ staff, coca = false, selector = false }: StaffProps) {
  // Computed on the server: only what is displayed reaches the page (real names never end up in
  // the L/C pages' HTML or data).
  const people: StaffPerson[] = (await getStaffMembers())
    .filter(p => (selector || staff === '*' || p.staff?.split('|').includes(staff)) && (!coca || p.coca))
    // Coca page: capi with an explicit `order` come first (ascending), the others keep the row order
    // (Array.sort is stable). Other pages: row order.
    .sort((a, b) => (coca ? orderKey(a) - orderKey(b) : 0))
    .map(p => ({
      name: displayName(p, staff, coca),
      // With the "nome di caccia" the role is not shown
      ruolo: usesHuntName(p, staff, coca) ? '' : p.ruolo,
      staff: p.staff,
      desc: p.desc ?? undefined,
      img: p.img ?? undefined,
    }))

  return <StaffGrid people={people} initialStaff={staff} showBadges={coca} showDesc={!coca && LC_STAFF.includes(staff)} selector={selector} />
}
