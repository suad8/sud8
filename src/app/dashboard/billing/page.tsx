import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { PLANS, formatPrice } from "@/lib/plans";
import { env } from "@/lib/env";
import { UpgradeButton } from "./UpgradeButton";

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const subscriptions = await db.subscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const pro = PLANS.PRO;
  const isPro = user.plan === "PRO";
  const pending = subscriptions.find((s) => s.status === "PENDING");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">الاشتراك</h1>
        <p className="text-sm text-neutral-500">
          الدفع لاشتراك المنصة فقط — لا علاقة له بالتحويلات إلى حساباتك.
        </p>
      </div>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-neutral-500">باقتك الحالية</p>
            <p className="text-xl font-bold text-neutral-900">{PLANS[user.plan].name}</p>
          </div>
          <span
            className={`badge ${isPro ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600"}`}
          >
            {isPro ? "نشطة" : "مجانية"}
          </span>
        </div>

        {isPro && user.planExpiresAt && (
          <p className="mt-3 text-sm text-neutral-600">
            تنتهي في{" "}
            <span className="ltr-nums font-mono">
              {user.planExpiresAt.toISOString().slice(0, 10)}
            </span>
          </p>
        )}
      </section>

      {!isPro && (
        <section className="card border-brand-200 p-5">
          <h2 className="text-lg font-bold text-neutral-900">{pro.name}</h2>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatPrice(pro.priceHalalas, pro.currency)}
            <span className="text-base font-medium text-neutral-500"> / شهريًا</span>
          </p>

          <ul className="mt-4 space-y-2">
            {pro.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                <span className="mt-1 text-brand-600">✓</span>
                {f}
              </li>
            ))}
          </ul>

          {pending ? (
            <p className="note-warn mt-5">
              طلبك قيد المراجعة. سيُفعّل الاشتراك بعد تأكيد الدفع.
            </p>
          ) : (
            <div className="mt-5">
              <UpgradeButton />
            </div>
          )}

          {env.PAYMENTS_PROVIDER === "manual" && (
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              بوابة الدفع في الوضع اليدوي: يُسجَّل طلبك ويفعّله المدير. لتفعيل
              الدفع الإلكتروني اضبط <code className="font-mono">PAYMENTS_PROVIDER</code>{" "}
              في ملف .env.
            </p>
          )}
        </section>
      )}

      {subscriptions.length > 0 && (
        <section className="card p-5">
          <h2 className="font-bold text-neutral-900">سجل الطلبات</h2>
          <ul className="mt-3 divide-y divide-neutral-100">
            {subscriptions.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="ltr-nums font-mono text-neutral-500">
                  {s.createdAt.toISOString().slice(0, 10)}
                </span>
                <span className="text-neutral-700">{formatPrice(s.amount, s.currency)}</span>
                <span className="badge-neutral">{STATUS_AR[s.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const STATUS_AR: Record<string, string> = {
  PENDING: "معلّق",
  ACTIVE: "نشط",
  CANCELED: "ملغى",
  EXPIRED: "منتهٍ",
  FAILED: "فشل",
};
