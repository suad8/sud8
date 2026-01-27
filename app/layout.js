import "./globals.css";
import { Tajawal } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["200","300","400","500","700","800","900"],
});

export const metadata = {
  title: "منيو سعود | Menu Saud",
  description: "منيو إلكتروني احترافي + خدمات + باقات + أعمال",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className}>
        <Navbar />
        <main className="container py-10">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
