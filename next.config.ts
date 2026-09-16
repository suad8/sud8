import type { NextConfig } from "next";

/**
 * رؤوس الأمان تُطبَّق على كل المسارات.
 *
 * ملاحظة على CSP: نتجنّب 'unsafe-inline' للسكربتات. Next.js يحقن سكربتات
 * inline للـ hydration، لذلك نعتمد على nonce يُولَّد في middleware.ts ويُمرَّر
 * عبر الهيدر `x-nonce`. الأنماط (styles) تحتاج 'unsafe-inline' لأن Tailwind
 * يحقن أنماطًا inline أثناء التطوير ولأن React يضبط style attributes.
 */
const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  // نمنع أي مصدر صور خارجي — كل الصور تُخدم من قاعدة البيانات عبر /api/media
  images: { remotePatterns: [] },

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
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          ...(isDev
            ? []
            : [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]),
        ],
      },
    ];
  },
};

export default nextConfig;
