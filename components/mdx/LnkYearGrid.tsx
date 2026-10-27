import { getMedia } from '@/lib/data'
import MediaYearGrid from './MediaYearGrid'

export default async function LnkYearGrid() {
  const media = (await getMedia()).map(item => ({
    name: item.name,
    id: item.slug,
    url: item.url,
    year: item.year,
    type: item.type === 'image' ? 'photo' : 'video',
  }))

  return <MediaYearGrid media={media} />
}
