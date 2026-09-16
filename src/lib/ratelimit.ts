import "server-only";

/**
 * تحديد معدّل بنافذة منزلقة في الذاكرة.
 *
 * كافٍ لخادم واحد. في الإنتاج متعدّد النسخ استبدل التخزين بـ Redis
 * (مثل @upstash/ratelimit) — الواجهة `consume()` تبقى كما هي.
 */
type Bucket = { hits: number[]; blockedUntil?: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

/** تنظيف دوري يمنع تضخّم الذاكرة */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.blockedUntil && b.blockedUntil > now) continue;
    if (b.hits.length === 0 || (b.hits[b.hits.length - 1] ?? 0) < now - 3_600_000) {
      buckets.delete(key);
    }
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * @param key      مفتاح الحد (مثل `otp:req:<email>`)
 * @param limit    عدد المحاولات المسموح بها داخل النافذة
 * @param windowMs طول النافذة بالمللي ثانية
 * @param blockMs  مدة الحظر بعد تجاوز الحد (اختياري)
 */
export function consume(
  key: string,
  limit: number,
  windowMs: number,
  blockMs = 0,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key) ?? { hits: [] };

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((bucket.blockedUntil - now) / 1000),
    };
  }

  bucket.hits = bucket.hits.filter((t) => t > now - windowMs);

  if (bucket.hits.length >= limit) {
    if (blockMs > 0) bucket.blockedUntil = now + blockMs;
    buckets.set(key, bucket);
    const retryMs = blockMs > 0 ? blockMs : windowMs - (now - (bucket.hits[0] ?? now));
    return { ok: false, remaining: 0, retryAfterSeconds: Math.ceil(retryMs / 1000) };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);
  return { ok: true, remaining: limit - bucket.hits.length, retryAfterSeconds: 0 };
}

/** إعادة تعيين مفتاح بعد نجاح العملية (مثل تحقق ناجح) */
export function reset(key: string): void {
  buckets.delete(key);
}

/** حدود جاهزة لكل مسار حسّاس */
export const LIMITS = {
  /** طلب رمز تحقق: 5 لكل بريد كل 15 دقيقة، ثم حظر 15 دقيقة */
  otpRequestPerEmail: (email: string) => consume(`otp:req:e:${email}`, 5, 900_000, 900_000),
  /** طلب رمز تحقق: 20 لكل IP كل 15 دقيقة */
  otpRequestPerIp: (ip: string) => consume(`otp:req:i:${ip}`, 20, 900_000, 900_000),
  /** محاولات تحقق: 10 لكل بريد كل 15 دقيقة */
  otpVerifyPerEmail: (email: string) => consume(`otp:vfy:e:${email}`, 10, 900_000, 900_000),
  /** كتابة عامة: 60 عملية لكل مستخدم في الدقيقة */
  writePerUser: (userId: string) => consume(`write:${userId}`, 60, 60_000),
  /** رفع الصور: 10 في الساعة */
  uploadPerUser: (userId: string) => consume(`upload:${userId}`, 10, 3_600_000),
};
