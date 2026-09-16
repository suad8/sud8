import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, ok, readJson, requireAdmin } from "@/lib/api";
import { adminUserActionSchema } from "@/lib/validation";
import { destroyAllSessions } from "@/lib/session";

/** إجراءات الإدارة على المستخدمين والصفحات */
export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const admin = await requireAdmin();
  if (admin instanceof NextResponse) return admin;

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = adminUserActionSchema.safeParse(body);
  if (!parsed.success) return fail("بيانات غير صالحة");

  const { userId, action, reason, plan } = parsed.data;

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!target) return fail("المستخدم غير موجود", 404);

  // حارس: لا يوقف مدير نفسه ولا مديرًا آخر
  if (target.role === "ADMIN" && (action === "suspend" || action === "set_plan")) {
    return fail("لا يمكن تنفيذ هذا الإجراء على حساب مدير", 403);
  }

  switch (action) {
    case "suspend":
      await db.user.update({ where: { id: userId }, data: { status: "SUSPENDED" } });
      // إبطال جلساته فورًا — الإيقاف يجب أن يسري الآن لا عند انتهاء الكوكي
      await destroyAllSessions(userId);
      break;

    case "activate":
      await db.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });
      break;

    case "block_page":
      await db.page.updateMany({
        where: { userId },
        data: { isBlocked: true, blockReason: reason || "مخالفة الشروط" },
      });
      break;

    case "unblock_page":
      await db.page.updateMany({
        where: { userId },
        data: { isBlocked: false, blockReason: null },
      });
      break;

    case "set_plan": {
      if (!plan) return fail("الباقة مطلوبة");
      await db.user.update({
        where: { id: userId },
        data: {
          plan,
          planExpiresAt: plan === "PRO" ? new Date(Date.now() + 365 * 86_400_000) : null,
        },
      });
      break;
    }
  }

  await db.auditLog.create({
    data: {
      actorId: admin.id,
      action: `admin.${action}`,
      target: userId,
      meta: reason ? JSON.stringify({ reason }) : null,
    },
  });

  return ok({ userId, action });
}
