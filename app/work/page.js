import SectionTitle from "@/components/SectionTitle";
import work from "@/data/work.json";
import { ArrowUpRight } from "lucide-react";

export const metadata = { title: "الأعمال | منيو سعود" };

export default function WorkPage() {
  return (
    <div className="space-y-8">
      <div className="card p-6 md:p-10">
        <SectionTitle title={work.title} subtitle={work.subtitle} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {work.items.map((w) => (
          <a key={w.id} href={w.link || "#"} target={w.link ? "_blank" : undefined}
             className="card p-6 hover:border-white/20 transition">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">{w.name}</div>
                <div className="mt-1 text-sm text-white/70">{w.desc}</div>
              </div>
              <div className="text-white/70 text-sm flex items-center gap-2">
                <span>{w.year}</span>
                <ArrowUpRight size={18} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {w.tags.map((t) => (
                <span key={t} className="badge">{t}</span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
