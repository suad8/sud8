import SectionTitle from "@/components/SectionTitle";
import MenuCategory from "@/components/MenuCategory";
import menu from "@/data/menu.json";
import { UtensilsCrossed } from "lucide-react";

export default function MenuPage({ searchParams }) {
  // دعم مشاركة منيو عبر رابط (data=base64)
  let incoming = null;
  try {
    if (searchParams?.data) {
      const jsonStr = Buffer.from(searchParams.data, "base64").toString("utf-8");
      incoming = JSON.parse(jsonStr);
    }
  } catch (e) {
    incoming = null;
  }

  const m = incoming || menu;

  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-10">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <UtensilsCrossed />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{m.title}</h1>
            <p className="mt-1 text-white/70">{m.subtitle}</p>
          </div>
        </div>

        {m.notice ? (
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            {m.notice}
          </div>
        ) : null}
      </div>

      <div className="space-y-5">
        {m.categories.map((cat) => (
          <MenuCategory key={cat.id} cat={cat} />
        ))}
      </div>

      <div className="hr" />
      <div className="card p-6 md:p-10">
        <SectionTitle title="طلب وتواصل" subtitle="عدّل الأزرار من data/site.json" />
        <div className="mt-5 flex flex-wrap gap-3">
          <a className="btn btnPrimary" href="https://wa.me/966500000000" target="_blank">واتساب</a>
          <a className="btn" href="/builder">اصنع منيو الآن</a>
          <a className="btn" href="/">الرجوع للرئيسية</a>
        </div>
      </div>
    </div>
  );
}
