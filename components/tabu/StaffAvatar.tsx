import Image from 'next/image'
import { staffImgPath } from '@/lib/imagekit'

// Same picture as the public staff cards (StaffGrid): the site photo, or a DiceBear avatar
export default function StaffAvatar({ img, name, size = 48 }: { img: string | null; name: string; size?: number }) {
  return (
    <Image
      src={img ? staffImgPath(img) : `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(name)}`}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="mask mask-squircle object-cover shrink-0"
    />
  )
}
