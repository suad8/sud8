import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reorderSchema } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.writePerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) return fail("ترتيب غير صالح");

  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: { id: true, accounts: { select: { id: true } } },
  });
  if (!page) return fail("الصفحة غير موجودة", 404);

  const owned = new Set(page.accounts.map((a) => a.id));
  const ids = parsed.data.ids;

  // نرفض الطلب كله إن حوى معرّفًا لا يخصّ هذا المستخدم، بدل تصفيته
  // بصمت والردّ بنجاح. التصفية لا تُسرّب شيئًا، لكن النجاح الصامت
  // يخفي طلبًا كان يجب أن يُرفض.
  const foreign = ids.filter((id) => !owned.has(id));
  if (foreign.length > 0) {
    return fail("قائمة الترتيب تحتوي حسابًا لا يخصّك", 403);
  }

  if (new Set(ids).size !== ids.length) {
    return fail("قائمة الترتيب فيها تكرار", 400);
  }

  if (ids.length !== page.accounts.length) {
    return fail("قائمة الترتيب لا تطابق حساباتك", 400);
  }

  // معاملة واحدة: إما يُطبَّق الترتيب كاملًا أو لا شيء
  await db.$transaction(
    ids.map((id, index) =>
      db.account.update({ where: { id }, data: { sortOrder: index } }),
    ),
  );

  return ok({ count: ids.length });
}
