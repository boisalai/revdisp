/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  images: {
    unoptimized: true
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'revdisp'}` : '',
  basePath: process.env.NODE_ENV === 'production' ? `/${process.env.GITHUB_REPOSITORY?.split('/')[1] || 'revdisp'}` : '',
}

module.exports = nextConfig