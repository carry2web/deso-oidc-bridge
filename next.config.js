/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add empty turbopack config to silence warning
  turbopack: {},
  transpilePackages: ['@libsql/client', '@prisma/adapter-libsql'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Mark these as external to prevent bundling issues
      config.externals.push('@prisma/client', '@prisma/adapter-libsql', '@libsql/client')
    }
    return config
  },
}

module.exports = nextConfig
