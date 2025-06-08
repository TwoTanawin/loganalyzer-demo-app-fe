/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    // Optimize for Docker
    serverComponentsExternalPackages: []
  }
}

module.exports = nextConfig