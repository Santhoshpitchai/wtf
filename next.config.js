/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  eslint: {
    // Use default ESLint configuration
    ignoreDuringBuilds: false,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude chromium and puppeteer from webpack bundling
      config.externals = [
        ...(config.externals || []),
        '@sparticuz/chromium',
        'puppeteer-core'
      ]
    }
    return config
  },
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
}

module.exports = nextConfig
