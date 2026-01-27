import SectionTitle from "@/components/SectionTitle";
import PriceCard from "@/components/PriceCard";
import packages from "@/data/packages.json";

export const metadata = { title: "الباقات | منيو سعود" };

export default function PackagesPage() {
  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-10">
        <SectionTitle title={packages.title} subtitle={packages.subtitle} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {packages.items.map((p) => (
          <PriceCard
            key={p.id}
            title={p.name}
            price={p.price}
            features={p.features}
            note={p.note}
            highlight={p.highlight}
          />
        ))}
      </div>

      <div className="card p-6 md:p-10">
        <SectionTitle title="ملاحظة" />
        <p className="mt-2 text-white/70">{packages.footerNote}</p>
      </div>
    </div>
  );
}
