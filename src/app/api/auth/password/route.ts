import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { consume } from "@/lib/ratelimit";
import { emailSchema } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, tooMany } from "@/lib/api";
import { clientIp, createSession } from "@/lib/session";
import { adminEmails, env, passwordLoginEnabled } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";

/**
 * دخول مؤقت بكلمة مرور — مخرج طوارئ لصاحب المنصة قبل تفعيل SMTP.
 *
 * حدوده مقصودة:
 *  • مُطفأ ما لم يُضبط ALLOW_PASSWORD_LOGIN=true صراحةً
 *  • حساب واحد فقط (OWNER_EMAIL)، لا تسجيل ولا استعادة
 *  • كلمة المرور 12 حرفًا فأكثر (يفرضها التحقق من البيئة)
 *  • محاولات محدودة لكل بريد ولكل IP
 *
 * أطفئه فور عمل البريد: احذف ALLOW_PASSWORD_LOGIN.
 */

const schema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة").max(200),
});

/**
 * نقارن هاشات بدل النصوص الخام: يضمن طولًا متساويًا فلا يُسرّب طول
 * كلمة المرور، ويبقى الفحص ثابت الزمن.
 */
function matches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest("hex");
  const b = createHash("sha256").update(expected).digest("hex");
  return safeEqual(a, b);
}

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  if (!passwordLoginEnabled) {
    return fail("الدخول بكلمة المرور غير مفعّل", 404);
  }

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات");

  const { email, password } = parsed.data;

  const ip = clientIp(await headers()) ?? "unknown";
  // أضيق من حدود رمز التحقق: 5 محاولات كل 15 دقيقة ثم حظر ساعة
  const perIp = consume(`pw:ip:${ip}`, 10, 900_000, 3_600_000);
  if (!perIp.ok) return tooMany(perIp.retryAfterSeconds);

  const perEmail = consume(`pw:em:${email}`, 5, 900_000, 3_600_000);
  if (!perEmail.ok) return tooMany(perEmail.retryAfterSeconds);

  const ownerEmail = (env.OWNER_EMAIL ?? "").trim().toLowerCase();

  // رسالة واحدة لكل حالات الفشل — لا تكشف أي الحقلين كان خاطئًا
  const invalid = () => fail("البريد أو كلمة المرور غير صحيحة", 401);

  if (!ownerEmail || email !== ownerEmail) return invalid();
  if (!matches(password, env.OWNER_PASSWORD ?? "")) return invalid();

  const isAdmin = adminEmails.includes(email);

  const user = await db.user.upsert({
    where: { email },
    update: isAdmin ? { role: "ADMIN" } : {},
    create: { email, role: isAdmin ? "ADMIN" : "USER" },
  });

  if (user.status === "SUSPENDED") {
    return fail("هذا الحساب موقوف.", 403);
  }

  await createSession(user.id);

  await db.auditLog.create({
    data: { actorId: user.id, action: "auth.password_login", target: user.id },
  });

  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });

  return ok({ next: page ? "/dashboard" : "/dashboard/setup" });
}
