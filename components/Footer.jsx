import site from "@/data/site.json";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="container py-10 grid gap-6 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-white/60">{site.footer.about}</p>
        </div>

        <div className="space-y-3">
          <div className="font-bold">روابط</div>
          <div className="grid gap-2 text-sm text-white/70">
            <a className="hover:text-white" href="/menu">المنيو</a>
            <a className="hover:text-white" href="/builder">اصنع منيو</a>
            <a className="hover:text-white" href="/services">الخدمات</a>
            <a className="hover:text-white" href="/packages">الباقات</a>
            <a className="hover:text-white" href="/work">الأعمال</a>
            <a className="hover:text-white" href="/contact">تواصل</a>
          </div>
        </div>

        <div className="space-y-3">
          <div className="font-bold">تواصل</div>
          <div className="text-sm text-white/70 space-y-2">
            <div>الهاتف: {site.contact.phone}</div>
            <div>الإيميل: {site.contact.email}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <a className="btn" href={site.links.whatsapp} target="_blank">واتساب</a>
              <a className="btn" href={site.links.instagram} target="_blank">انستقرام</a>
              <a className="btn" href={site.links.website} target="_blank">الموقع</a>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 text-xs text-white/50 flex flex-wrap items-center justify-between gap-2">
        <div>© {new Date().getFullYear()} منيو سعود</div>
        <div>Built with Next.js + Tailwind + Framer Motion</div>
      </div>
    </footer>
  );
}
