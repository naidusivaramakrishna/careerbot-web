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
        destination: 'http://localhost:8000/api/:path*',
      },
    ];
  },

  // Fix for uuid v13.0.0 and Node.js built-in modules
  webpack: (config, { webpack }) => {
    // Use NormalModuleReplacementPlugin to handle node: protocol imports
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^node:/,
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

    return config;
  },
};

export default nextConfig;
