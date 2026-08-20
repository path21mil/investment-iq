import type { NextConfig } from "next";

// Check if we are in local development mode
const isDev = process.env.NODE_ENV !== 'production';

// Build the CSP string dynamically
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: https://financialmodelingprep.com;
  font-src 'self' data:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
`.replace(/\n/g, '').replace(/\s+/g, ' ').trim();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Content-Security-Policy', value: cspHeader }
        ],
      },
    ];
  },
};

export default nextConfig;