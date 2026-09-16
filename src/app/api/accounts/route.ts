import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accountSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";
import { planOf } from "@/lib/plans";

/** GET — حسابات المستخدم الحالي فقط */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const page = await db.page.findUnique({
    where: { userId: user.id },
    include: { accounts: { orderBy: { sortOrder: "asc" } } },
  });

  return ok({ accounts: page?.accounts ?? [] });
}

/** POST — إضافة حساب */
export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.writePerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات", 400, fieldErrors(parsed.error));

  // العزل: نجلب الصفحة عبر userId من الجلسة، لا من جسم الطلب
  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: { id: true, _count: { select: { accounts: true } } },
  });

  if (!page) return fail("أنشئ صفحتك أولًا", 400);

  const max = planOf(user.plan).maxAccounts;

  /**
   * العدّ والإنشاء داخل معاملة واحدة مع قفل صف الصفحة.
   *
   * فحصهما منفصلَين سباقٌ كلاسيكي: طلبات متوازية تعدّ كلها قبل أن يكتب
   * أيٌّ منها، فتمرّ جميعها. قياسًا: 12 طلبًا متزامنًا أنشأت 6 حسابات
   * والحد 3. القفل يُسلسل الطلبات على الصفحة نفسها فقط، فكل طلب يرى
   * العدد بعد سابقه.
   */
  const isPostgres = (process.env.DATABASE_URL ?? "").startsWith("postgres");

  const result = await db.$transaction(async (tx) => {
    if (isPostgres) {
      // SQLite لا يدعم FOR UPDATE، لكنه يُسلسل الكتابة أصلًا بكاتب واحد
      await tx.$executeRaw`SELECT id FROM "Page" WHERE id = ${page.id} FOR UPDATE`;
    }

    const count = await tx.account.count({ where: { pageId: page.id } });
    if (count >= max) return { limited: true as const };

    const last = await tx.account.findFirst({
      where: { pageId: page.id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const account = await tx.account.create({
      data: {
        pageId: page.id,
        kind: parsed.data.kind,
        provider: parsed.data.provider,
        beneficiary: parsed.data.beneficiary,
        valueType: parsed.data.valueType,
        value: parsed.data.value,
        note: parsed.data.note || null,
        isHidden: parsed.data.isHidden ?? false,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });

    return { limited: false as const, account };
  });

  if (result.limited) {
    return fail(
      `وصلت الحد الأقصى لباقتك (${max} حسابات). رقِّ إلى PRO لإضافة المزيد.`,
      403,
    );
  }

  return ok({ account: result.account }, 201);
}
