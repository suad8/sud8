import SectionTitle from "@/components/SectionTitle";
import PriceCard from "@/components/PriceCard";
import services from "@/data/services.json";

export const metadata = { title: "الخدمات | منيو سعود" };

export default function ServicesPage() {
  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-10">
        <SectionTitle title={services.title} subtitle={services.subtitle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {services.items.map((s) => (
          <PriceCard key={s.id} title={s.name} price={s.price} features={s.features} note={s.note} />
        ))}
      </div>
    </div>
  );
}
