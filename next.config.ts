import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // ✅ Make sure this is here

  // ✅ Enable faster page transitions
  experimental: {
    optimizePackageImports: ['lucide-react', '@/components', '@/utils'],
  },

  // ✅ Optimize production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

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

    // ✅ Keep Next.js default optimization, just add chunk splitting hints
    // Don't override optimization completely - merge with defaults
    if (config.optimization) {
      config.optimization.moduleIds = 'deterministic';

      // Only customize splitChunks if it exists
      if (config.optimization.splitChunks && typeof config.optimization.splitChunks !== 'boolean') {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...(typeof config.optimization.splitChunks === 'object' && 'cacheGroups' in config.optimization.splitChunks ? config.optimization.splitChunks.cacheGroups : {}),
            // Add custom cache group for lucide-react icons
            icons: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'icons',
              chunks: 'all',
              priority: 30,
            },
          },
        };
      }
    }

    return config;
  },
};

export default nextConfig;
