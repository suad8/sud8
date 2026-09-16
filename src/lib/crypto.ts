import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { env } from "./env";

/** رمز عشوائي آمن للجلسات (256 بت، base64url) */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * هاش رموز الجلسات بـ SHA-256.
 * الرمز عالي الإنتروبيا (256 بت) فلا يحتاج هاشًا بطيئًا — ولا يجوز أن يكون
 * بطيئًا لأنه يُنفَّذ على كل طلب.
 */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** رمز تحقق من 6 أرقام بمولّد عشوائي مشفّر (لا Math.random) */
export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** هاش لا رجعي للـ IP — يمنع تخزين بيانات تعريف خام مع إبقاء التجميع ممكنًا */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`${env.APP_SECRET}:${ip}`).digest("hex").slice(0, 32);
}

/** مقارنة بزمن ثابت لسلسلتين نصيتين */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** معرّف عشوائي قصير للاستخدام العام */
export function randomId(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}
