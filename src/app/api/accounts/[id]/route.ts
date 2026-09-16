import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";

type Ctx = { params: Promise<{ id: string }> };

/**
 * التحقق من الملكية قبل أي تعديل.
 * نطابق الحساب بـ id **و** pageId المشتق من جلسة المستخدم، فلا يمكن
 * لمستخدم تعديل حساب غيره حتى لو خمّن المعرّف.
 */
async function ownedAccount(userId: string, accountId: string) {
  return db.account.findFirst({
    where: { id: accountId, page: { userId } },
    select: { id: true, pageId: true },
  });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.writePerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const { id } = await params;
  const existing = await ownedAccount(user.id, id);
  if (!existing) return fail("الحساب غير موجود", 404);

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات", 400, fieldErrors(parsed.error));

  const account = await db.account.update({
    where: { id: existing.id },
    data: {
      kind: parsed.data.kind,
      provider: parsed.data.provider,
      beneficiary: parsed.data.beneficiary,
      valueType: parsed.data.valueType,
      value: parsed.data.value,
      note: parsed.data.note || null,
      isHidden: parsed.data.isHidden ?? false,
    },
  });

  return ok({ account });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { id } = await params;
  const existing = await ownedAccount(user.id, id);
  if (!existing) return fail("الحساب غير موجود", 404);

  await db.account.delete({ where: { id: existing.id } });
  return ok({ id });
}
