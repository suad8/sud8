import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { LIMITS, reset } from "@/lib/ratelimit";
import { verifyOtpSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, tooMany } from "@/lib/api";
import { createSession } from "@/lib/session";
import { adminEmails } from "@/lib/env";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = verifyOtpSchema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات", 400, fieldErrors(parsed.error));

  const { email, code } = parsed.data;

  const limit = LIMITS.otpVerifyPerEmail(email);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const record = await db.otpCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  // رسالة واحدة لكل حالات الفشل — لا نكشف إن كان الرمز منتهيًا أم خاطئًا
  const invalid = () => fail("الرمز غير صحيح أو منتهي الصلاحية", 400);

  if (!record) return invalid();

  if (record.attempts >= MAX_ATTEMPTS) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
    return invalid();
  }

  const match = await bcrypt.compare(code, record.codeHash);

  if (!match) {
    await db.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return invalid();
  }

  // استهلاك الرمز فورًا — استخدام واحد فقط
  await db.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });

  const isAdmin = adminEmails.includes(email);

  const user = await db.user.upsert({
    where: { email },
    update: isAdmin ? { role: "ADMIN" } : {},
    create: { email, role: isAdmin ? "ADMIN" : "USER" },
  });

  if (user.status === "SUSPENDED") {
    return fail("هذا الحساب موقوف. تواصل مع الدعم.", 403);
  }

  await createSession(user.id);
  reset(`otp:vfy:e:${email}`);

  const page = await db.page.findUnique({ where: { userId: user.id }, select: { id: true } });

  return ok({
    // نوجّه المستخدم الجديد إلى إعداد صفحته
    next: page ? "/dashboard" : "/dashboard/setup",
  });
}
