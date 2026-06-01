import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // ✅ Make sure this is here
 
  eslint: {
    ignoreDuringBuilds: true,
  },
 
  typescript: {
    ignoreBuildErrors: true,
  },


  images: {
    minimumCacheTTL: 60,
    // Bypass Next.js image optimization for localhost backend images — they may
    // return empty buffers when the backend is down, causing LRUCache size=0 crash.
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/profile_pictures/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/v1/admin/jobs/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3000",
        pathname: "/uploads/profile_pictures/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.licdn.com",
        pathname: "/**",
      }
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },

  // Fix for uuid v13.0.0 and Node.js built-in modules
  webpack: (config, { webpack, isServer }) => {
    // Use NormalModuleReplacementPlugin to handle node: protocol imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (resource: any) => {
          resource.request = resource.request.replace(/^node:/, '');
        }
      )
    );

    // Resolve uuid module
    config.resolve.alias = {
      ...config.resolve.alias,
      'uuid': require.resolve('uuid'),
    };

    // Exclude browser-only packages from server bundle (prevents SSR prerender errors)
    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        'mespeak',
        'jsdom',
      ];
    }

    return config;
  },
};

export default nextConfig;
