import { Logo } from "@/components/Brand";

/**
 * تُعرض حين تنقص متغيّرات بيئة إلزامية.
 *
 * نعرض أسماء المتغيّرات الناقصة فقط — لا قيمها ولا أي تفصيل عن البنية
 * التحتية. الاسم وحده كافٍ للمشغّل ليصلح الإعداد، ولا يفيد غيره.
 */
export function SetupRequired({ issues }: { issues: string[] }) {
  const names = [...new Set(issues.map((i) => i.split(":")[0]!.trim()))];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-12">
      <main className="w-full max-w-lg">
        <div className="flex items-center gap-3">
          <Logo size={34} />
          <span className="text-lg font-bold text-neutral-900">حوّل</span>
        </div>

        <div className="card mt-5 p-6">
          <span className="badge-warn">الإعداد غير مكتمل</span>

          <h1 className="mt-3 text-xl font-bold text-neutral-900">
            التطبيق يعمل، لكن ينقصه إعداد
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            المتغيّرات التالية غير مضبوطة في بيئة التشغيل. أضفها ثم أعد النشر.
          </p>

          <ul className="mt-4 space-y-2">
            {names.map((n) => (
              <li
                key={n}
                className="ltr-nums rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 font-mono text-sm font-semibold text-danger-700"
              >
                {n}
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-neutral-200 pt-4 text-sm text-neutral-600">
            <p className="font-semibold text-neutral-800">على Railway</p>
            <ol className="mt-2 list-decimal space-y-1.5 ps-5 leading-relaxed">
              <li>
                افتح الخدمة ← <span className="font-semibold">Variables</span>
              </li>
              <li>
                لقاعدة البيانات:{" "}
                <span className="font-semibold">New Variable → Add Reference</span> ←
                اختر Postgres ← <code className="font-mono text-xs">DATABASE_URL</code>
              </li>
              <li>
                لبقية المتغيّرات:{" "}
                <span className="font-semibold">New Variable</span> واكتب الاسم والقيمة
              </li>
              <li>أعد النشر</li>
            </ol>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            تفاصيل الخطأ كاملة في سجل الخادم — شغّل{" "}
            <code className="font-mono">railway logs</code>.
          </p>
        </div>
      </main>
    </div>
  );
}
