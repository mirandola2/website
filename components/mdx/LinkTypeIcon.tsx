import { BookOpenIcon, FileTextIcon, LinkSimpleIcon, PlayCircleIcon } from '@phosphor-icons/react/ssr'
import type { Icon } from '@phosphor-icons/react'
import { LINK_TYPES, type LinkType } from '@/lib/links'

const icons: Record<LinkType, Icon> = {
  link: LinkSimpleIcon,
  document: FileTextIcon,
  video: PlayCircleIcon,
  book: BookOpenIcon,
}

export default function LinkTypeIcon({ type, size = 20 }: { type: LinkType; size?: number }) {
  const IconComponent = icons[type]
  return <IconComponent size={size} weight="duotone" aria-label={LINK_TYPES.find(t => t.value === type)?.label} />
}
