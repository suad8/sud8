import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { SetupForm } from "./SetupForm";
import { DEFAULT_THEME } from "@/lib/plans";

/** إنشاء الصفحة لأول مرة — خطوة واحدة قصيرة */
export default async function SetupPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (page) redirect("/dashboard");

  // اقتراح اسم مستخدم من البريد
  const suggestion = user.email
    .split("@")[0]!
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-xl font-bold text-neutral-900">أنشئ صفحتك</h1>
      <p className="mt-1.5 text-sm text-neutral-600">
        خطوة واحدة، ثم تضيف حساباتك. تقدر تعدّل كل شيء لاحقًا.
      </p>
      <SetupForm
        suggestedUsername={suggestion.length >= 3 ? suggestion : ""}
        defaultTheme={DEFAULT_THEME}
      />
    </div>
  );
}
