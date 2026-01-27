import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // ✅ Make sure this is here
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
