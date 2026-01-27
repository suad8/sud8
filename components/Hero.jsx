"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, QrCode, Sparkles, UtensilsCrossed } from "lucide-react";

export default function Hero() {
  return (
    <div className="card overflow-hidden">
      <div className="relative p-6 md:p-12">
        <div
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{
            background:
              "radial-gradient(900px 400px at 80% 30%, rgba(43,124,255,.35), transparent 60%), radial-gradient(700px 380px at 10% 20%, rgba(21,92,255,.20), transparent 55%)"
          }}
        />
        <div className="relative grid gap-10 md:grid-cols-2 items-center">
          <div>
            <div className="badge">
              <Sparkles size={14} /> موقع منيو احترافي
            </div>

            <h1 className="mt-4 text-3xl md:text-5xl font-black leading-tight">
              منيو سعود
              <span className="block text-white/70 text-xl md:text-2xl font-bold mt-2">
                منيو إلكتروني + باقات + أعمال — جاهز للـ QR
              </span>
            </h1>

            <p className="mt-4 text-white/70 text-base md:text-lg">
              منيو سعود يقدم لك منيو إلكتروني احترافي للمطاعم والكافيهات مع عرض الخدمات والباقات بشكل مرتب وواضح، قابل للتحديث في أي وقت.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                className="btn btnPrimary"
                href="/builder"
              >
                <QrCode size={18} /> اصنع منيو الآن
              </a>

              <a
                className="btn"
                href="https://wa.me/966532212529?text=ابغى%20نموذج%20منيو%20تجريبي%20مجانا"
                target="_blank"
              >
                <UtensilsCrossed size={18} /> مشاهدة نموذج منيو
              </a>

              <a className="btn" href="/packages">
                الباقات <ArrowUpRight size={18} />
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <div className="font-extrabold text-lg">Preview</div>
                <span className="badge">
                  <QrCode size={14} /> QR Ready
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold">صنف رقم {i}</div>
                      <div className="text-sm text-white/60 mt-1">
                        وصف مختصر للصنف مع تفاصيل بسيطة
                      </div>
                    </div>
                    <div className="font-black text-brand-200">
                      {(12 + i) + " ر.س"}
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 text-xs text-white/60">
                * هذا مجرد مثال — نقدر نسويلك منيو تجريبي حقيقي خلال ساعات قليلة مجانًا.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
