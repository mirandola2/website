// Types of the materials and links page rows (link.type): each one has its own icon

export const LINK_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'document', label: 'Documento' },
  { value: 'video', label: 'Video' },
  { value: 'book', label: 'Libro' },
] as const

export type LinkType = (typeof LINK_TYPES)[number]['value']
