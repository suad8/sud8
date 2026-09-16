import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { normalizeTheme, planOf, THEMES } from "@/lib/plans";
import { PageSettingsForm } from "./PageSettingsForm";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const page = await db.page.findUnique({ where: { userId: user.id } });
  if (!page) redirect("/dashboard/setup");

  const plan = planOf(user.plan);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-bold text-neutral-900">إعداد الصفحة</h1>
        <p className="text-sm text-neutral-500">الاسم والصورة والوصف ورابطك.</p>
      </div>

      <PageSettingsForm
        initial={{
          displayName: page.displayName,
          bio: page.bio ?? "",
          username: page.username,
          theme: normalizeTheme(page.theme),
          accentColor: page.accentColor ?? "",
          hideBranding: page.hideBranding,
          isPublished: page.isPublished,
          avatarId: page.avatarId,
        }}
        themes={THEMES.map((t) => ({ ...t, locked: !plan.themes.includes(t.id) }))}
        canCustomColors={plan.customColors}
        canRemoveBranding={plan.removeBranding}
      />
    </div>
  );
}
