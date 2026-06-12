import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // CSP is set per-request in middleware.ts with a per-request nonce (no unsafe-inline)
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ['janitor-cultivate-arrive.ngrok-free.dev'],
  turbopack: {
    root: __dirname,
  },
  experimental: {
    scrollRestoration: false,
    serverActions: {
      // H2: reduced from 50mb to match max file size (10MB) + overhead
      bodySizeLimit: '12mb',
    },
  },
  // M9: removed transpilePackages — framer-motion v11+ ships ESM, no transpile needed
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    // Uploaded images live at unique (timestamped) paths, so optimized
    // variants can be cached long: browser + CDN + .next/cache/images.
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
