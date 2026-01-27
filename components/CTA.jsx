"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, QrCode, PhoneCall } from "lucide-react";

export default function CTA() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="card p-6 md:p-10"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-2xl md:text-3xl font-black">جاهز تبدأ؟</div>
          <p className="mt-2 text-white/70">
            اصنع منيو في دقيقتين وخذ رابط + QR، أو عدّل ملفات JSON وثبّت المنيو.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a className="btn btnPrimary" href="/builder"><QrCode size={18} /> اصنع منيو</a>
          <a className="btn" href="/contact"><PhoneCall size={18} /> تواصل</a>
          <a className="btn" href="/packages">الباقات <ArrowUpRight size={18} /></a>
        </div>
      </div>
    </motion.div>
  );
}
