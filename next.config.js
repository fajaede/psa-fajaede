/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

// Everything except the badge may not be framed by other sites (clickjacking).
const noFraming = [
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; form-action 'self'; frame-ancestors 'none'",
  },
];

const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Old badge embeds use an <iframe> to /embed/psa, so that path stays frameable.
      { source: "/((?!embed/).*)", headers: noFraming },
    ];
  },
};

module.exports = nextConfig;
