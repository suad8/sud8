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
      id: uid(),
      name: "قهوة",
      note: "ساخن / بارد",
      items: [
        { id: uid(), name: "لاتيه", desc: "حليب + اسبريسو", price: "18 ر.س", badge: "الأكثر طلباً" },
        { id: uid(), name: "كابتشينو", desc: "رغوة كثيفة", price: "17 ر.س", badge: "" }
      ]
    }
  ]);

  const payload = useMemo(
    () => ({ title, subtitle, notice, categories: cats }),
    [title, subtitle, notice, cats]
  );

  const shareUrl = useMemo(() => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      return typeof window !== "undefined"
        ? `${window.location.origin}/menu?data=${encoded}`
        : "";
    } catch {
      return "";
    }
  }, [payload]);

  const openMenu = () => {
    if (!shareUrl) return;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    alert("تم نسخ رابط المنيو ✅");
  };

  const addCat = () =>
    setCats((p) => [...p, { id: uid(), name: "قسم جديد", note: "", items: [] }]);

  const removeCat = (id) =>
    setCats((p) => p.filter((c) => c.id !== id));

  const addItem = (catId) =>
    setCats((p) =>
      p.map((c) =>
        c.id === catId
          ? { ...c, items: [...c.items, { id: uid(), name: "صنف", desc: "", price: "0 ر.س", badge: "" }] }
          : c
      )
    );

  const removeItem = (catId, itemId) =>
    setCats((p) =>
      p.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.filter((i) => i.id !== itemId) }
          : c
      )
    );

  const updateCat = (catId, key, val) =>
    setCats((p) => p.map((c) => (c.id === catId ? { ...c, [key]: val } : c)));

  const updateItem = (catId, itemId, key, val) =>
    setCats((p) =>
      p.map((c) =>
        c.id === catId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, [key]: val } : i)) }
          : c
      )
    );

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <motion.div className="card p-6 md:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <Sparkles />
          </div>
          <div>
            <h1 className="text-2xl font-black">صانع المنيو الإلكتروني</h1>
            <p className="text-white/60 text-sm">صمّم منيوك واطلعه جاهز فورًا مع رابط و QR</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn" onClick={addCat}>
            <Plus size={18} /> إضافة قسم
          </button>

          <button className="btn btnPrimary" onClick={openMenu}>
            <QrCode size={18} /> إنشاء المنيو وفتحه
          </button>

          <button className="btn" onClick={copy}>
            <Copy size={18} /> نسخ الرابط
          </button>
        </div>

        {shareUrl && (
          <div className="mt-5 flex items-center gap-4">
            <QRCodeCanvas value={shareUrl} size={110} />
            <div className="text-sm text-white/70">
              امسح الكود أو شارك الرابط مباشرة مع العميل
            </div>
          </div>
        )}
      </motion.div>

      {/* MENU BUILDER */}
      {cats.map((cat) => (
        <div key={cat.id} className="card p-6 space-y-4">
          <div className="flex gap-2 items-center">
            <input
              className="input flex-1"
              value={cat.name}
              onChange={(e) => updateCat(cat.id, "name", e.target.value)}
              placeholder="اسم القسم"
            />
            <button className="btn" onClick={() => removeCat(cat.id)}>
              <Trash2 size={16} />
            </button>
          </div>

          <input
            className="input"
            value={cat.note}
            onChange={(e) => updateCat(cat.id, "note", e.target.value)}
            placeholder="ملاحظة القسم"
          />

          {cat.items.map((item) => (
            <div key={item.id} className="grid md:grid-cols-4 gap-2">
              <input
                className="input"
                value={item.name}
                onChange={(e) => updateItem(cat.id, item.id, "name", e.target.value)}
                placeholder="اسم الصنف"
              />
              <input
                className="input"
                value={item.desc}
                onChange={(e) => updateItem(cat.id, item.id, "desc", e.target.value)}
                placeholder="الوصف"
              />
              <input
                className="input"
                value={item.price}
                onChange={(e) => updateItem(cat.id, item.id, "price", e.target.value)}
                placeholder="السعر"
              />
              <button className="btn" onClick={() => removeItem(cat.id, item.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <button className="btn" onClick={() => addItem(cat.id)}>
            + إضافة صنف
          </button>
        </div>
      ))}
    </div>
  );
}
