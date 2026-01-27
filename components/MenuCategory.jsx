import SectionTitle from "@/components/SectionTitle";

export default function MenuCategory({ cat }) {
  return (
    <section className="card p-6 md:p-8">
      <SectionTitle title={cat.name} subtitle={cat.note} />
      <div className="mt-5 grid gap-3">
        {cat.items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="font-bold">{item.name}</div>
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </div>
              {item.desc ? <div className="mt-1 text-sm text-white/70">{item.desc}</div> : null}
            </div>
            <div className="shrink-0 text-left font-black text-brand-200">{item.price}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
