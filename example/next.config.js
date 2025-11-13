const isProduction = process.env.NODE_ENV === 'production'
const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  basePath: isProduction? '/near-connect-hooks' : '',
  output: "export",
  distDir: 'build',
  reactStrictMode: true,
  transpilePackages: ['near-connect-hooks'],
  outputFileTracingRoot: path.join(__dirname, '../'),
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig;