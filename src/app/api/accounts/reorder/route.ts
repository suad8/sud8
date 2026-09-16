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

  // نقبل فقط المعرّفات المملوكة فعلًا لهذه الصفحة
  const owned = new Set(page.accounts.map((a) => a.id));
  const ids = parsed.data.ids.filter((id) => owned.has(id));

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
