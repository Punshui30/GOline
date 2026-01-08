/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes for /api/intent
  images: {
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  trailingSlash: true,
  // Disable static optimization for pages that use client-side features
  // This prevents build failures from useContext errors during SSG
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}

module.exports = nextConfig

