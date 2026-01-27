import { Check } from "lucide-react";
import { cn } from "@/components/utils";

export default function PriceCard({ title, price, features = [], note, highlight }) {
  return (
    <div className={cn("card p-6", highlight && "border-brand-400/40")}>
      {highlight ? <div className="badge mb-3">الأكثر اختيارًا</div> : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-extrabold">{title}</div>
          {note ? <div className="mt-1 text-sm text-white/70">{note}</div> : null}
        </div>
        <div className="text-left">
          <div className="text-2xl font-black text-brand-200">{price}</div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm text-white/75">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1 text-brand-200"><Check size={16} /></span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <a className={cn("btn w-full", highlight && "btnPrimary")} href="/contact">
          اطلب الآن
        </a>
      </div>
    </div>
  );
}
