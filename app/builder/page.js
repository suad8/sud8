"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, QrCode, Copy, Sparkles } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function BuilderPage() {
  const [title, setTitle] = useState("منيو سعود");
  const [subtitle, setSubtitle] = useState("اختر القسم اللي تبيه 👇");
  const [notice, setNotice] = useState("الأسعار شاملة الضريبة - يسعدنا خدمتك");
  const [cats, setCats] = useState([
    {
      id: "coffee",
      name: "قهوة",
      note: "ساخن / بارد",
      items: [
        { id: "latte", name: "لاتيه", desc: "حليب + اسبريسو", price: "18 ر.س", badge: "الأكثر طلباً" },
        { id: "cap", name: "كابتشينو", desc: "رغوة كثيفة", price: "17 ر.س", badge: "" },
      ],
    },
  ]);

  const payload = useMemo(() => ({ title, subtitle, notice, categories: cats }), [title, subtitle, notice, cats]);

  const shareUrl = useMemo(() => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      return typeof window !== "undefined" ? `${window.location.origin}/menu?data=${encoded}` : "";
    } catch {
      return "";
    }
  }, [payload]);

  const copy = async (txt) => {
    try {
      await navigator.clipboard.writeText(txt);
      alert("تم النسخ ✅");
    } catch {
      alert("انسخ يدويًا 🙏");
    }
  };

  const addCat = () => {
    setCats((p) => [...p, { id: uid(), name: "قسم جديد", note: "", items: [] }]);
  };

  const removeCat = (id) => setCats((p) => p.filter((c) => c.id !== id));

  const addItem = (catId) => {
    setCats((p) =>
      p.map((c) =>
        c.id === catId
          ? { ...c, items: [...c.items, { id: uid(), name: "صنف", desc: "", price: "0 ر.س", badge: "" }] }
          : c
      )
    );
  };

  const removeItem = (catId, itemId) => {
    setCats((p) => p.map((c) => (c.id === catId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c)));
  };

  const updateCat = (catId, key, value) => {
    setCats((p) => p.map((c) => (c.id === catId ? { ...c, [key]: value } : c)));
  };

  const updateItem = (catId, itemId, key, value) => {
    setCats((p) =>
      p.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, [key]: value } : i)) }
          : c
      )
    );
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 md:p-10"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Sparkles />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">صانع المنيو</h1>
            <p className="mt-1 text-white/70">عدّل البيانات ثم خذ رابط المشاركة و QR</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <div className="text-sm text-white/70">عنوان المنيو</div>
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
              value={title} onChange={(e)=>setTitle(e.target.value)} />
          </label>

          <label className="space-y-2 md:col-span-2">
            <div className="text-sm text-white/70">وصف مختصر</div>
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
              value={subtitle} onChange={(e)=>setSubtitle(e.target.value)} />
          </label>

          <label className="space-y-2 md:col-span-3">
            <div className="text-sm text-white/70">ملاحظة/تنبيه</div>
            <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
              value={notice} onChange={(e)=>setNotice(e.target.value)} />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn btnPrimary" onClick={addCat}><Plus size={18} /> إضافة قسم</button>
          <a className="btn" href="/menu" target="_blank">فتح المنيو</a>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-5">
          {cats.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-bold text-lg">القسم</div>
                <button className="btn" onClick={() => removeCat(c.id)}><Trash2 size={18} /> حذف</button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <div className="text-sm text-white/70">اسم القسم</div>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                    value={c.name} onChange={(e) => updateCat(c.id, "name", e.target.value)} />
                </label>
                <label className="space-y-2">
                  <div className="text-sm text-white/70">ملاحظة</div>
                  <input className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                    value={c.note} onChange={(e) => updateCat(c.id, "note", e.target.value)} />
                </label>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-white/70">الأصناف</div>
                <button className="btn" onClick={() => addItem(c.id)}><Plus size={18} /> إضافة صنف</button>
              </div>

              <div className="mt-3 space-y-3">
                {c.items.map((i) => (
                  <div key={i.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex justify-between items-center gap-3">
                      <div className="font-semibold">{i.name || "صنف"}</div>
                      <button className="btn" onClick={() => removeItem(c.id, i.id)}><Trash2 size={18} /></button>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <input placeholder="اسم الصنف" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                        value={i.name} onChange={(e) => updateItem(c.id, i.id, "name", e.target.value)} />
                      <input placeholder="السعر (مثال: 18 ر.س)" className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                        value={i.price} onChange={(e) => updateItem(c.id, i.id, "price", e.target.value)} />
                      <input placeholder="وصف" className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                        value={i.desc} onChange={(e) => updateItem(c.id, i.id, "desc", e.target.value)} />
                      <input placeholder="بادج (اختياري)" className="md:col-span-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-brand-400/60"
                        value={i.badge} onChange={(e) => updateItem(c.id, i.id, "badge", e.target.value)} />
                    </div>
                  </div>
                ))}
                {c.items.length === 0 ? (
                  <div className="text-sm text-white/60">لا يوجد أصناف—اضف صنف.</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-5">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 font-bold text-lg"><QrCode /> رابط و QR</div>
              <button className="btn" onClick={() => copy(shareUrl)}><Copy size={18} /> نسخ الرابط</button>
            </div>
            <p className="mt-2 text-sm text-white/70 break-all">{shareUrl}</p>

            <div className="mt-5 flex flex-wrap items-center gap-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <QRCodeCanvas value={shareUrl || "https://example.com"} size={180} includeMargin />
              </div>
              <div className="text-sm text-white/70 space-y-2">
                <div>• افتح الرابط في جوالك وتأكد من العرض.</div>
                <div>• اطبع الـ QR وحطه على الطاولات/الكاشير.</div>
                <div>• تقدر تنسخ JSON وتحطه في data/menu.json لو تبي تثبته.</div>
              </div>
            </div>

            <div className="mt-5">
              <button className="btn" onClick={() => copy(JSON.stringify(payload, null, 2))}><Copy size={18} /> نسخ JSON</button>
            </div>
          </div>

          <div className="card p-6">
            <div className="font-bold text-lg">معاينة سريعة</div>
            <p className="mt-2 text-sm text-white/70">هذه معاينة مختصرة—المعاينة الكاملة عبر /menu.</p>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xl font-extrabold">{title}</div>
              <div className="text-white/70">{subtitle}</div>
              <div className="mt-3 text-xs text-white/60">{notice}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
