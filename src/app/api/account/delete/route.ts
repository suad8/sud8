import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, ok, readJson, requireUser } from "@/lib/api";
import { destroySession } from "@/lib/session";

/**
 * حق الإتلاف — المادة 4 من نظام حماية البيانات الشخصية.
 *
 * حذف فعلي لا تعطيل: المستخدم وصفحته وحساباته وصوره وجلساته
 * واشتراكاته. العلاقات في المخطط تسلسلية (onDelete: Cascade) فحذف
 * المستخدم يمحو ما تحته.
 *
 * يبقى سطر واحد في سجل التدقيق بلا معرّف المستخدم — عدّاد مجهّل لا
 * يربط بشخص، نحتفظ به لمراقبة إساءة الاستخدام.
 */
const schema = z.object({
  confirm: z.literal("حذف حسابي", {
    errorMap: () => ({ message: "اكتب «حذف حسابي» للتأكيد" }),
  }),
});

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("اكتب «حذف حسابي» بالضبط للتأكيد", 400, {
      confirm: "نص التأكيد غير مطابق",
    });
  }

  // آخر مدير لا يُحذف — وإلا بقيت المنصة بلا من يديرها
  if (user.role === "ADMIN") {
    const admins = await db.user.count({ where: { role: "ADMIN" } });
    if (admins <= 1) {
      return fail("لا يمكن حذف آخر حساب مدير في المنصة", 403);
    }
  }

  await db.$transaction([
    db.auditLog.create({
      data: {
        action: "account.deleted",
        meta: JSON.stringify({ at: new Date().toISOString() }),
      },
    }),
    // سجل التدقيق ليس مرتبطًا بالمستخدم بمفتاح أجنبي، فلا يمحوه الحذف
    // التسلسلي. نقطع الرابط بأنفسنا: يبقى الحدث وتاريخه لمراقبة إساءة
    // الاستخدام، ولا يبقى ما يربطه بشخص.
    db.auditLog.updateMany({
      where: { actorId: user.id },
      data: { actorId: null, target: null, meta: null },
    }),
    db.auditLog.updateMany({
      where: { target: user.id },
      data: { target: null },
    }),
    // الحذف يسري على Page و Account و Media و Session و Subscription
    db.user.delete({ where: { id: user.id } }),
  ]);

  await destroySession();

  return ok({ deleted: true, next: "/" });
}
