import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  // Serve under /synapse in production to match nginx routing
  basePath: isProd ? '/synapse' : '',
  assetPrefix: isProd ? '/synapse' : '',

  // Required for standalone Docker output
  output: 'standalone',

  // Allow images from Polymarket CDN (for market thumbnails later)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.polymarket.com',
      },
    ],
  },
}

export default nextConfig