import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false, // ✅ Make sure this is here

  // Dev-server rewrites proxy default is 30s; mock-test/generate routinely
  // takes 30-60s (Azure OpenAI generation + verify chain) so requests get
  // killed mid-flight with ECONNRESET. Raise to 4 minutes.
  experimental: {
    proxyTimeout: 240000,
  },

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
    // BACKEND_URL lets local devs override the proxy target when WSL's
    // automatic localhost-forwarding for podman ports breaks (set in .env.local).
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        // Forward /api/* to backend EXCEPT routes handled locally by Next.js.
        // Negative lookahead skips: ats-score, auth, backend, generate-description, generate-docx, rasa.
        source: '/api/:path((?!ats-score|auth|backend|generate-description|generate-docx|rasa).+)',
        destination: `${backendUrl}/api/:path`,
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
        'html-to-docx',
      ];
    }

    return config;
  },
};

export default nextConfig;
