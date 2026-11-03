import type { NextConfig } from 'next'
import withMDX from '@next/mdx'

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './lib/imagekit-loader.ts',
    qualities: [50, 75],
  },
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  async headers() {
    return [
      // The worker is checked for changes on every visit: a cached copy would keep old versions alive
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
    ]
  },
  // Allow testing the dev server from other devices on the LAN (e.g. http://192.168.x.x:3000):
  // without this Next blocks its dev scripts for those origins and the page never hydrates.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '*.local'],
}

export default withMDX({
  options: {
    remarkPlugins: ['remark-frontmatter', 'remark-mdx-frontmatter', 'remark-gfm'],
  },
})(nextConfig)
