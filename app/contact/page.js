import SectionTitle from "@/components/SectionTitle";
import site from "@/data/site.json";
import { Phone, Mail, Instagram, Globe, MessageCircle } from "lucide-react";

export const metadata = { title: "تواصل | منيو سعود" };

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-10">
        <SectionTitle title="تواصل معنا" subtitle="روابط جاهزة—عدّلها من data/site.json" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="font-bold text-lg">قنوات التواصل</div>
          <div className="mt-4 space-y-3">
            <a className="btn w-full justify-between" href={site.links.whatsapp} target="_blank">
              <span className="inline-flex items-center gap-2"><MessageCircle size={18} /> واتساب</span>
              <span className="text-white/60">فتح</span>
            </a>
            <a className="btn w-full justify-between" href={site.links.instagram} target="_blank">
              <span className="inline-flex items-center gap-2"><Instagram size={18} /> انستقرام</span>
              <span className="text-white/60">فتح</span>
            </a>
            <a className="btn w-full justify-between" href={site.links.website} target="_blank">
              <span className="inline-flex items-center gap-2"><Globe size={18} /> الموقع</span>
              <span className="text-white/60">فتح</span>
            </a>
          </div>
        </div>

        <div className="card p-6">
          <div className="font-bold text-lg">تفاصيل سريعة</div>
          <div className="mt-4 space-y-3 text-white/75">
            <div className="flex items-center gap-2"><Phone size={18} /> {site.contact.phone}</div>
            <div className="flex items-center gap-2"><Mail size={18} /> {site.contact.email}</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
              {site.contact.note}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
