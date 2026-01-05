/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds (not needed for netlify dev)
  // output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Temporarily ignore build errors to isolate Netlify plugin issue
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig



