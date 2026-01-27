import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import SectionTitle from "@/components/SectionTitle";
import CTA from "@/components/CTA";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <Hero />
      <FeatureGrid />

      <div className="card p-6 md:p-10">
        <SectionTitle
          title="ليش منيو سعود؟"
          subtitle="واجهة نظيفة، ألوان أزرق وأبيض، أنميشن ناعم، وميزات مهمة لعرض المنيو والخدمات والباقات."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-bold">مناسب للـ QR</div>
            <p className="mt-2 text-white/70 text-sm">رابط مباشر للمنيو + إمكانية توليد QR بسهولة.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-bold">احترافي للعرض</div>
            <p className="mt-2 text-white/70 text-sm">صفحات خدمات وباقات وأعمالك بشكل مرتب وواضح.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="text-lg font-bold">سهل التعديل</div>
            <p className="mt-2 text-white/70 text-sm">كل المحتوى في ملفات JSON داخل مجلد data.</p>
          </div>
        </div>
      </div>

      <CTA />
    </div>
  );
}
