import type { MDXComponents } from 'mdx/types'
import Staff from '@/components/mdx/Staff'
import Fig from '@/components/mdx/Fig'
import TableOfContents from '@/components/mdx/TableOfContents'
import Cards from '@/components/mdx/Cards'
import Card from '@/components/mdx/Card'
import Quoted from '@/components/mdx/Quoted'
import Lnk from '@/components/mdx/Lnk'
import LnkYearGrid from '@/components/mdx/LnkYearGrid'
import LinkList from '@/components/mdx/LinkList'
import GroupSize from '@/components/mdx/GroupSize'
import MyDiv from '@/components/mdx/MyDiv'
import MdxImage from '@/components/mdx/MdxImage'
import ImageLink from '@/components/mdx/ImageLink'

// Page-specific client tools (Alci, Morse, CodiceSocio) are imported by their own .mdx file:
// registering them here would ship their JS on every MDX page, homepage included.
export function useMDXComponents(): MDXComponents {
  return {
    img: MdxImage,
    Staff,
    Fig,
    TableOfContents,
    Cards,
    Card,
    Quoted,
    Lnk,
    LnkYearGrid,
    LinkList,
    GroupSize,
    MyDiv,
    ImageLink,
  }
}
