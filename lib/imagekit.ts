// Images live on ImageKit, not in /public: every local path must go through here.
export const IMAGEKIT_BASE = 'https://ik.imagekit.io/mir2'

export function imagekitUrl(src: string, transforms?: string) {
  if (src.startsWith('http://') || src.startsWith('https://')) return src
  const path = src.startsWith('/') ? src : `/${src}`
  return `${IMAGEKIT_BASE}${path}${transforms ? `?tr=${transforms}` : ''}`
}

// Staff photos: rows imported from the CSV hold a file name inside /img/staff/; photos uploaded
// from the Tabù hold their full ImageKit path (the folder differs between dev and production).
export function staffImgPath(img: string) {
  return img.startsWith('/') ? img : `/img/staff/${img}`
}
