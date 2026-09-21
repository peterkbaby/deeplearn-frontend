import type { NextConfig } from "next";

const authApiUrl = process.env.AUTH_API_URL ?? "http://127.0.0.1:8000";
const docmindApiUrl = process.env.DOCMIND_API_URL ?? "http://127.0.0.1:8000";

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // Next 16.3's CLI TypeScript runner loses --showConfig output under Node 22,
  // which aborts a production build before BUILD_ID is written. Use the stable
  // TypeScript API for this application instead.
  experimental: { useTypeScriptCli: false },
  async rewrites() {
    // Local development has no Nginx. Production Nginx handles these same
    // paths before they reach Next.js, so this is only a development bridge.
    return [
      {
        source: "/user-service/:path*",
        destination: `${authApiUrl}/user-service/:path*`,
      },
      {
        source: "/doc-service/:path*",
        destination: `${docmindApiUrl}/:path*`,
      },
      { source: "/auth/google", destination: `${authApiUrl}/auth/google` },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          },
        ],
      },
    ];
  },
};
export default config;
