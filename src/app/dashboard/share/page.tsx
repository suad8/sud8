import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SharePanel } from "./SharePanel";

export default async function SharePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: {
      username: true,
      displayName: true,
      isPublished: true,
      isBlocked: true,
      viewCount: true,
    },
  });
  if (!page) redirect("/dashboard/setup");

  const live = page.isPublished && !page.isBlocked;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">المشاركة</h1>
        <p className="text-sm text-neutral-500">
          رابطك ورمزك ثابتان — تعديل الحسابات لا يغيّرهما.
        </p>
      </div>

      {!live && (
        <p className="note-warn">
          {page.isBlocked
            ? "صفحتك محجوبة حاليًا، فالرابط والرمز لا يعملان."
            : "صفحتك غير منشورة."}{" "}
          <Link href="/dashboard/settings" className="font-bold underline">
            الإعدادات
          </Link>
        </p>
      )}

      <SharePanel username={page.username} displayName={page.displayName} enabled={live} />

      <div className="card p-4">
        <p className="text-sm text-neutral-500">مرات فتح الصفحة</p>
        <p className="ltr-nums mt-1 text-2xl font-bold text-neutral-900">{page.viewCount}</p>
      </div>
    </div>
  );
}
