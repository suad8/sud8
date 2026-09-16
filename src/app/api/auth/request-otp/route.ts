import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { generateOtp } from "@/lib/crypto";
import { LIMITS } from "@/lib/ratelimit";
import { otpEmail, sendMail } from "@/lib/mailer";
import { requestOtpSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, tooMany } from "@/lib/api";
import { clientIp } from "@/lib/session";
import { isProd } from "@/lib/env";

const OTP_TTL_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات", 400, fieldErrors(parsed.error));

  const { email } = parsed.data;

  const ip = clientIp(await headers()) ?? "unknown";
  const ipLimit = LIMITS.otpRequestPerIp(ip);
  if (!ipLimit.ok) return tooMany(ipLimit.retryAfterSeconds);

  const emailLimit = LIMITS.otpRequestPerEmail(email);
  if (!emailLimit.ok) return tooMany(emailLimit.retryAfterSeconds);

  // نبطل أي رموز سابقة غير مستهلكة لنفس البريد — رمز واحد فعّال في كل وقت
  await db.otpCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  const code = generateOtp();

  await db.otpCode.create({
    data: {
      email,
      // bcrypt لأن الرمز منخفض الإنتروبيا (6 أرقام) ويحتاج هاشًا بطيئًا
      codeHash: await bcrypt.hash(code, 10),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  await sendMail({ to: email, ...otpEmail(code) });

  // ملاحظة أمنية: نرد بنفس الرسالة سواء كان البريد مسجّلًا أم لا،
  // فلا يستطيع أحد استخدام هذا المسار لمعرفة من لديه حساب.
  return ok({
    message: "أرسلنا رمز التحقق إلى بريدك إن كان صالحًا.",
    // في التطوير فقط نعيد الرمز لتسهيل الاختبار
    ...(isProd ? {} : { devCode: code }),
  });
}
