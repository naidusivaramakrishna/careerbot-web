import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,


  images: {
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
      }
    ],
  },
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
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
