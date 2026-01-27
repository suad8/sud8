"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, BadgeCheck, Flame, Star, ShoppingBag } from "lucide-react";

function normalizeBadge(badge = "") {
  const t = badge.trim();
  if (!t) return null;
  // نرتّب شارات بسيطة
  if (t.includes("الأكثر") || t.includes("طلب")) return { text: t, icon: Star };
  if (t.includes("حار") || t.includes("سبايسي")) return { text: t, icon: Flame };
  if (t.includes("جديد")) return { text: t, icon: BadgeCheck };
  return { text: t, icon: BadgeCheck };
}

export default function MenuThemeSaud({ menu, whatsappUrl }) {
  const [q, setQ] = useState("");
  const categories = menu?.categories || [];

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return categories;

    return categories
      .map((c) => ({
        ...c,
        items: (c.items || []).filter((i) => {
          const t = `${i.name || ""} ${i.desc || ""} ${i.badge || ""}`.toLowerCase();
          return t.includes(query);
        })
      }))
      .filter((c) => (c.items || []).length > 0);
  }, [q, categories]);

  const scrollTo = (id) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-[#071125]/80 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-white/70 text-xs">منيو إلكتروني</div>
              <div className="text-white text-xl font-black leading-tight">{menu?.title || "منيو"}</div>
              {menu?.subtitle ? <div className="text-white/60 text-sm mt-1">{menu.subtitle}</div> : null}
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 rounded-2xl px-4 py-2 bg-white/10 border border-white/10 hover:bg-white/15 transition text-white font-bold"
            >
              <ShoppingBag size={18} />
              اطلب الآن
            </a>
          </div>

          {/* Search */}
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <Search size={16} className="text-white/50" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ابحث عن صنف…"
              className="w-full bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
            />
          </div>

          {/* Tabs */}
          <div className="mt-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {(categories || []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => scrollTo(c.id)}
                  className="shrink-0 rounded-2xl px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/80 text-sm font-bold"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {menu?.notice ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white/70 text-sm">
            {menu.notice}
          </div>
        ) : null}

        {(filtered || []).map((cat) => (
          <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-36">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-white text-xl font-black">{cat.name}</h2>
                {cat.note ? <div className="text-white/60 text-sm mt-1">{cat.note}</div> : null}
              </div>

              <div className="text-white/40 text-xs">{(cat.items || []).length} صنف</div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {(cat.items || []).map((item) => {
                const badge = normalizeBadge(item.badge);
                const Icon = badge?.icon;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4 hover:bg-white/7 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-extrabold text-base">{item.name}</div>
                        {item.desc ? <div className="text-white/60 text-sm mt-1">{item.desc}</div> : null}

                        {badge ? (
                          <div className="mt-2 inline-flex items-center gap-2 rounded-2xl px-3 py-1 bg-[#2B7CFF]/15 border border-[#2B7CFF]/25 text-[#CFE2FF] text-xs font-bold">
                            {Icon ? <Icon size={14} /> : null}
                            {badge.text}
                          </div>
                        ) : null}
                      </div>

                      <div className="text-[#CFE2FF] font-black whitespace-nowrap">
                        {item.price || ""}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
            ما لقينا نتائج 😅 جرّب كلمة ثانية.
          </div>
        ) : null}
      </div>

      {/* Floating WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-5 right-5 z-30 rounded-full px-5 py-3 bg-[#2B7CFF] hover:opacity-90 transition text-white font-black shadow-lg"
      >
        تواصل واتساب
      </a>
    </div>
  );
}
