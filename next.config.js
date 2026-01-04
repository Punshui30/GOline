/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export only for production builds (not needed for netlify dev)
  // output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig



