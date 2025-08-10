/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.REPO_NAME : '',
  basePath: process.env.NODE_ENV === 'production' ? process.env.REPO_NAME : '',
}

module.exports = nextConfig