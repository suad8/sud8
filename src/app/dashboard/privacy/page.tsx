import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { DangerZone } from "./DangerZone";

export const metadata: Metadata = { title: "بياناتي" };

export default async function DataRightsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="h-page">بياناتي وخصوصيتي</h1>
        <p className="text-sm text-neutral-500">
          حقوقك على بياناتك وفق نظام حماية البيانات الشخصية السعودي.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="h-section">نزّل نسخة من بياناتك</h2>
        <p className="mt-1.5 text-sm text-neutral-600">
          ملف JSON يحوي كل ما تحتفظ به المنصة عنك: حسابك وصفحتك وحساباتك
          البنكية وجلساتك واشتراكاتك وسجل نشاطك.
        </p>
        <a href="/api/account/export" download className="btn-ghost mt-4">
          تنزيل بياناتي
        </a>
      </section>

      <section className="card p-5">
        <h2 className="h-section">تصحيح بياناتك</h2>
        <p className="mt-1.5 text-sm text-neutral-600">
          تعدّل اسمك ووصفك وصورتك ورابطك من إعداد الصفحة، وحساباتك البنكية من
          صفحة الحسابات — في أي وقت وبلا وسيط.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/dashboard/settings" className="btn-ghost">إعداد الصفحة</Link>
          <Link href="/dashboard" className="btn-ghost">حساباتي</Link>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="h-section">ما نحتفظ به وكم</h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700">
          <li>• رموز التحقق: 10 دقائق، وتُحذف خلال 24 ساعة</li>
          <li>• الجلسات: 30 يومًا، وتُحذف تلقائيًا بعد انتهائها</li>
          <li>• سجل النشاط: سنة واحدة</li>
          <li>• بيانات حسابك: ما دام حسابك قائمًا</li>
        </ul>
        <p className="mt-3 text-xs text-neutral-500">
          التفاصيل في <Link href="/privacy" className="font-semibold text-brand-700">سياسة الخصوصية</Link>.
        </p>
      </section>

      <DangerZone />
    </div>
  );
}
