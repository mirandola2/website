// Staff codes used in staff_member.staff (`|`-separated for double services)

export const staffLabels: Record<string, string> = {
  L: 'Lupetti',
  C: 'Coccinelle',
  E: 'Esploratori',
  G: 'Guide',
  N: 'Noviziato',
  CF: 'Clan Fuoco',
  CC: 'Co.Ca.',
  CJ: 'Co.Ca.',
}

export const staffColors: Record<string, string> = {
  L: 'bg-lc text-lc-content',
  C: 'bg-lc text-lc-content',
  E: 'bg-eg text-eg-content',
  G: 'bg-eg text-eg-content',
  N: 'bg-rs text-rs-content',
  CF: 'bg-rs text-rs-content',
  CC: 'bg-cc text-cc-content',
  CJ: 'bg-cc text-cc-content',
}

// Public unit pages that show a staff (<Staff staff="..." /> in content/)
export const staffPages: Record<string, { href: string; label: string }> = {
  L: { href: '/lc/lupetti/', label: 'Branco' },
  C: { href: '/lc/coccinelle/', label: 'Cerchio' },
  E: { href: '/eg/brownsea/', label: 'Reparto Brownsea' },
  G: { href: '/eg/antares/', label: 'Reparto Antares' },
  N: { href: '/rs/noviziato/', label: 'Noviziato' },
  CF: { href: '/rs/mdv/', label: 'Clan Fuoco' },
}

export const splitStaff = (staff: string) => staff.split('|').map(s => s.trim()).filter(Boolean)

// Lupetti/Coccinelle: shown with their "nome di caccia" and a description on the unit pages
export const LC_STAFF = ['L', 'C']
export const isLcStaff = (staff: string) => splitStaff(staff).some(s => LC_STAFF.includes(s))
