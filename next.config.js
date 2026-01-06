/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'output: export' disables API routes. For Navigator app, remove this.
  // If you need static export for portfolio, consider splitting into separate apps.
  output: 'export',
  images: {
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  trailingSlash: true,
}

module.exports = nextConfig

