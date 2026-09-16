import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { envIssues } from "@/lib/env";
import { SetupRequired } from "@/components/SetupRequired";

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "حوّل — كل حساباتك في رابط واحد",
    template: "%s | حوّل",
  },
  description:
    "أنشئ صفحة واحدة تجمع حساباتك البنكية ومحافظك، وشاركها برابط قصير ورمز QR. النسخ بضغطة واحدة.",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2b4cd4",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      {/* إعداد ناقص يُوقف كل الصفحات عند حاجز واحد يشرح السبب، بدل أن
          تفشل كل صفحة على حدة برسالة غامضة */}
      <body>{envIssues.length > 0 ? <SetupRequired issues={envIssues} /> : children}</body>
    </html>
  );
}
