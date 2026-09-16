import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { contactEmail } from "@/lib/env";

/** هيكل مشترك للوثائق النظامية — سياسة الخصوصية وشروط الاستخدام */
export function LegalShell({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/">
            <Wordmark />
          </Link>
          <Link href="/login" className="btn-ghost">
            دخول
          </Link>
        </div>
      </header>

      <main className="container-app py-10">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{title}</h1>
        <p className="mt-1 text-xs text-neutral-500">آخر تحديث: {updated}</p>
        <p className="mt-4 max-w-[60ch] leading-relaxed text-neutral-700">{intro}</p>

        <div className="legal mt-8 space-y-7">{children}</div>

        <nav className="mt-12 flex flex-wrap gap-3 border-t border-neutral-200 pt-6 text-sm">
          <Link href="/privacy" className="font-semibold text-brand-700">سياسة الخصوصية</Link>
          <Link href="/terms" className="font-semibold text-brand-700">شروط الاستخدام</Link>
          <Link href="/" className="text-neutral-600">الرئيسية</Link>
        </nav>
      </main>
    </div>
  );
}

export function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-2.5 text-lg font-bold text-neutral-900">
        <span className="font-mono text-sm text-brand-600">{n}</span>
        {title}
      </h2>
      <div className="mt-2.5 space-y-3 leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

/**
 * بريد التواصل النظامي.
 *
 * حين لا يُضبط `CONTACT_EMAIL` نعرض تحذيرًا بدل عنوان وهمي: سياسة
 * الخصوصية تَعِد بالرد خلال 30 يومًا، ووعد بصندوق لا وجود له أسوأ من
 * الصمت — فليكن الخلل ظاهرًا لمالك المنصة لا مخفيًا عن المستخدم.
 */
export function ContactEmail() {
  if (!contactEmail) {
    return (
      <span className="note-warn mt-2 block">
        لم يُضبط بريد التواصل بعد. اضبط <code>CONTACT_EMAIL</code> في متغيّرات
        البيئة — الوثيقة تَعِد بالرد على طلبات البيانات خلال 30 يومًا.
      </span>
    );
  }

  return (
    <a href={`mailto:${contactEmail}`} className="ltr-nums">
      {contactEmail}
    </a>
  );
}
