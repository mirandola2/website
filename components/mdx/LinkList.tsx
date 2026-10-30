import { getLinks } from '@/lib/data'
import LinkGrid from './LinkGrid'

// The materials and links page (rows edited in /tabu/admin/link)
export default async function LinkList() {
  return <LinkGrid links={await getLinks()} />
}
