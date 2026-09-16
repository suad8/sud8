import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { planOf } from "@/lib/plans";
import { AccountsManager } from "./AccountsManager";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = await db.page.findUnique({
    where: { userId: user.id },
    include: { accounts: { orderBy: { sortOrder: "asc" } } },
  });

  // لا صفحة بعد → وجّه المستخدم لإنشائها أولًا
  if (!page) redirect("/dashboard/setup");

  const plan = planOf(user.plan);

  return (
    <div className="space-y-5">
      {page.isBlocked && (
        <div
          role="alert"
          className="note-danger"
        >
          <strong className="block font-bold">صفحتك محجوبة</strong>
          <p className="mt-1">{page.blockReason ?? "مخالفة شروط الاستخدام"}</p>
          <p className="mt-1 text-xs">تواصل مع الدعم لمراجعة القرار.</p>
        </div>
      )}

      {!page.isPublished && !page.isBlocked && (
        <div className="note-warn">
          صفحتك غير منشورة حاليًا — الزوار لن يتمكنوا من فتحها.{" "}
          <Link href="/dashboard/settings" className="font-bold underline">
            تفعيل النشر
          </Link>
        </div>
      )}

      <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm text-neutral-500">رابط صفحتك</p>
          <p className="ltr-nums mt-0.5 truncate font-mono text-sm font-semibold text-neutral-900">
            /u/{page.username}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/u/${page.username}`} target="_blank" className="btn-ghost">
            معاينة
          </Link>
          <Link href="/dashboard/share" className="btn-primary">
            مشاركة
          </Link>
        </div>
      </div>

      <AccountsManager
        initialAccounts={page.accounts.map((a) => ({
          id: a.id,
          kind: a.kind,
          provider: a.provider,
          beneficiary: a.beneficiary,
          valueType: a.valueType,
          value: a.value,
          note: a.note,
          isHidden: a.isHidden,
        }))}
        maxAccounts={plan.maxAccounts}
        planName={plan.name}
      />
    </div>
  );
}
