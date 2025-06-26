/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  experimental: {
    serverActions: true,
  },
  // Add WebSocket support
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3001/socket.io/:path*',
      },
    ];
  },
  // Increase body size limit
  serverRuntimeConfig: {
    maxFileSize: '10mb',
  },
  publicRuntimeConfig: {
    maxFileSize: '10mb',
  },
};

module.exports = nextConfig;