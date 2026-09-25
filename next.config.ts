const supabaseHostname = (() => {
  try { return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null }
  catch { return null }
})()

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.razorpay.com https://maps.googleapis.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://images.unsplash.com https://lh3.googleusercontent.com${supabaseHostname ? ` https://${supabaseHostname}` : ''}`,
  "media-src 'self' blob: https:",
  "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://api.razorpay.com https://www.youtube.com https://player.vimeo.com",
  `connect-src 'self' https: wss:${supabaseHostname ? ` https://${supabaseHostname} wss://${supabaseHostname}` : ''}`,
  "upgrade-insecure-requests",
].join('; ')

const nextConfig: import('next').NextConfig = {
  // Enforce type checking during production builds
  typescript: {
    ignoreBuildErrors: false,
  },
  // Performance optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      ...(supabaseHostname ? [{ protocol: 'https' as const, hostname: supabaseHostname }] : []),
    ],
  },
  // Optimize page loading
  experimental: {
    // Disabled optimizeCss due to critters module issue
    // optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-avatar', '@radix-ui/react-dialog'],
  },
  // Compression
  compress: true,
  // Production optimizations
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'Content-Security-Policy', value: contentSecurityPolicy },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      ],
    }]
  },
}
export default nextConfig;
