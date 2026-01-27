"use client";

import { motion } from "framer-motion";
import { QrCode, LayoutDashboard, Palette, Zap, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  { icon: QrCode, title: "QR سريع", desc: "ولّد QR من داخل صانع المنيو وشاركه للعميل." },
  { icon: Smartphone, title: "متجاوب", desc: "تصميم ممتاز للجوال والطاولات." },
  { icon: Palette, title: "أزرق/أبيض", desc: "ستايل حديث مع تدرجات أنيقة." },
  { icon: Zap, title: "خفيف وسريع", desc: "Next.js + Tailwind لأداء ممتاز." },
  { icon: LayoutDashboard, title: "منظم", desc: "صفحات: منيو، خدمات، باقات، أعمال، تواصل." },
  { icon: ShieldCheck, title: "جاهز للنشر", desc: "ارفعه GitHub ثم انشره على Vercel." },
];

export default function FeatureGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {features.map((f, idx) => {
        const Icon = f.icon;
        return (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.05 }}
            className="card p-6"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <Icon />
              </div>
              <div className="font-extrabold text-lg">{f.title}</div>
            </div>
            <p className="mt-3 text-sm text-white/70">{f.desc}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
