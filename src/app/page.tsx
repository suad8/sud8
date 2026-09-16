import Link from "next/link";
import { Glyph, Wordmark } from "@/components/Brand";
import { CopyButton } from "@/components/CopyButton";
import { PLANS, formatPrice } from "@/lib/plans";
import { formatIban } from "@/lib/iban";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/85 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Wordmark />
          <nav className="flex items-center gap-1.5">
            {user ? (
              <Link href="/dashboard" className="btn-primary">
                لوحتي
              </Link>
            ) : (
              <>
                <Link href="/login" className="btn-quiet">
                  دخول
                </Link>
                <Link href="/login" className="btn-primary">
                  ابدأ مجانًا
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        {/* ── البطل ── */}
        <section className="container-app pb-16 pt-14 text-center">
          <span className="badge-brand">مجانًا — بدون بطاقة بنكية</span>

          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-neutral-900 sm:text-4xl">
            كل حساباتك البنكية
            <br />
            في <span className="text-brand-600">رابط واحد</span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base text-neutral-600">
            بدل ما ترسل الآيبان في كل مرة، شارك رابطًا واحدًا يجمع حساباتك
            ومحافظك. الطرف الآخر ينسخ البيانات بضغطة زر.
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link href="/login" className="btn-primary px-7">
              أنشئ رابطك مجانًا
            </Link>
            <a href="#preview" className="btn-ghost">
              شوف نموذجًا
            </a>
          </div>

          <p className="mt-5 text-xs text-neutral-500">
            رابط ثابت ورمز QR · تعدّل حساباتك متى شئت والرابط لا يتغيّر
          </p>

          <div id="preview" className="mt-12 scroll-mt-24">
            <PreviewCard />
          </div>
        </section>

        {/* ── كيف تعمل ── */}
        <section className="border-y border-neutral-200 bg-neutral-50 py-14">
          <div className="container-app">
            <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
              ثلاث خطوات
            </h2>

            <ol className="mt-8 space-y-3">
              {[
                { n: "١", t: "سجّل بالبريد", d: "رمز تحقق يصلك على بريدك — بدون كلمة مرور." },
                { n: "٢", t: "أضف حساباتك", d: "آيبان أو رقم حساب أو محفظة، مع اسم المستفيد." },
                { n: "٣", t: "شارك رابطك", d: "رابط قصير ورمز QR جاهز للطباعة أو الإرسال." },
              ].map((s) => (
                <li key={s.n} className="card flex items-start gap-4 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="h-section">{s.t}</h3>
                    <p className="mt-0.5 text-sm text-neutral-600">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── الباقات ── */}
        <section className="container-app py-14">
          <h2 className="text-center text-2xl font-bold tracking-tight text-neutral-900">
            الباقات
          </h2>
          <p className="mt-1.5 text-center text-neutral-600">ابدأ مجانًا، ورقِّ متى احتجت.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {(["FREE", "PRO"] as const).map((id) => {
              const plan = PLANS[id];
              const isPro = id === "PRO";

              return (
                <div
                  key={id}
                  className={`card relative p-5 ${isPro ? "border-brand-600 ring-1 ring-brand-600" : ""}`}
                >
                  {isPro && (
                    <span className="badge-solid absolute -top-2.5 right-5">الأشهر</span>
                  )}

                  <h3 className="h-section">{plan.name}</h3>
                  <p className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
                    {formatPrice(plan.priceHalalas, plan.currency)}
                    {plan.priceHalalas > 0 && (
                      <span className="text-sm font-medium text-neutral-500"> / شهريًا</span>
                    )}
                  </p>

                  <ul className="mt-4 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckMark />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`mt-5 w-full ${isPro ? "btn-primary" : "btn-ghost"}`}
                  >
                    {isPro ? "ابدأ بـ PRO" : "ابدأ مجانًا"}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="mx-auto mt-6 max-w-md text-center text-xs leading-relaxed text-neutral-500">
            الدفع مخصّص لاشتراك المنصة فقط. «حوّل» لا تستقبل ولا توجّه أي تحويل
            بينك وبين زوّار صفحتك.
          </p>
        </section>
      </main>

      <footer className="border-t border-neutral-200 py-10">
        <div className="container-app flex flex-col items-center gap-3 text-center">
          <Glyph size={22} className="text-brand-600" />
          <p className="max-w-sm text-xs leading-relaxed text-neutral-500">
            «حوّل» تعرض بيانات الحسابات كما يدخلها صاحب الصفحة. تأكّد من صحة
            البيانات مع الشخص نفسه قبل أي تحويل.
          </p>
          <p className="text-xs text-neutral-400">© {new Date().getFullYear()} حوّل</p>
        </div>
      </footer>
    </div>
  );
}

/** نموذج حيّ يعرض الصفحة العامة داخل إطار جوال */
function PreviewCard() {
  const sampleIban = "SA0380000000608010167519";

  return (
    <div className="mx-auto max-w-sm">
      <div className="rounded-2xl border border-neutral-200 bg-neutral-100 p-2.5 shadow-lg">
        <div className="theme-mint themed-page rounded-xl px-4 py-6">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              م
            </div>
            <p className="mt-3 font-bold">مقهى الرصيف</p>
            <p className="themed-muted mt-0.5 text-xs">للطلبات والحجوزات</p>
          </div>

          <div className="mt-5 space-y-2.5">
            <SampleAccount
              provider="مصرف الراجحي"
              beneficiary="محمد بن سعد"
              type="آيبان"
              display={formatIban(sampleIban)}
              raw={sampleIban}
            />
            <SampleAccount
              provider="STC Pay"
              beneficiary="محمد بن سعد"
              type="رقم محفظة"
              display="+966512345678"
              raw="+966512345678"
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-neutral-400">
        هكذا يراها من تشارك معه الرابط
      </p>
    </div>
  );
}

function SampleAccount({
  provider,
  beneficiary,
  type,
  display,
  raw,
}: {
  provider: string;
  beneficiary: string;
  type: string;
  display: string;
  raw: string;
}) {
  return (
    <div className="themed-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{provider}</p>
          <p className="themed-muted mt-0.5 truncate text-xs">{beneficiary}</p>
        </div>
        <span
          className="badge shrink-0"
          style={{
            background: "color-mix(in srgb, var(--accent) 12%, transparent)",
            color: "var(--accent)",
          }}
        >
          {type}
        </span>
      </div>

      <p className="datum mt-2.5 break-all text-xs">{display}</p>

      <div className="mt-2.5">
        <CopyButton value={raw} label="نسخ الرقم" />
      </div>
    </div>
  );
}

function CheckMark() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-1 shrink-0 text-brand-600"
      aria-hidden="true"
    >
      <path
        d="m5 13 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
