import "server-only";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { env } from "./env";
import { getCurrentUser, type SessionUser } from "./session";

/** رد خطأ موحّد */
export function fail(message: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ ok: false, message, fields }, { status });
}

export function ok<T extends object>(data: T = {} as T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function tooMany(retryAfterSeconds: number) {
  return NextResponse.json(
    { ok: false, message: `محاولات كثيرة. حاول بعد ${retryAfterSeconds} ثانية.` },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}

/**
 * حماية CSRF: نرفض أي طلب تغيير حالة قادم من أصل مختلف.
 *
 * الكوكي أصلًا sameSite=lax فلا تُرسل مع POST عبر المواقع، وهذا فحص ثانٍ
 * (دفاع بالعمق) يغطي المتصفحات القديمة والحالات الحدّية.
 */
export async function assertSameOrigin(): Promise<true | NextResponse> {
  const hdrs = await headers();
  const origin = hdrs.get("origin");

  // الطلبات بلا Origin (مثل curl) مسموحة فقط خارج الإنتاج
  if (!origin) {
    return env.NODE_ENV === "production"
      ? fail("طلب مرفوض: أصل غير معروف", 403)
      : true;
  }

  let allowed: string;
  try {
    allowed = new URL(env.APP_URL).origin;
  } catch {
    return fail("إعداد APP_URL غير صالح", 500);
  }

  const host = hdrs.get("host");
  const hostOrigin = host ? [`https://${host}`, `http://${host}`] : [];

  if (origin !== allowed && !hostOrigin.includes(origin)) {
    return fail("طلب مرفوض: أصل غير مطابق", 403);
  }
  return true;
}

/** يتطلب مستخدمًا مسجّلًا — يعيد الرد الخطأ أو المستخدم */
export async function requireUser(): Promise<SessionUser | NextResponse> {
  const user = await getCurrentUser();
  if (!user) return fail("يجب تسجيل الدخول", 401);
  if (user.status === "SUSPENDED") return fail("الحساب موقوف", 403);
  return user;
}

/** يتطلب مديرًا */
export async function requireAdmin(): Promise<SessionUser | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (user.role !== "ADMIN") return fail("غير مصرّح", 403);
  return user;
}

/** قراءة JSON بأمان مع سقف للحجم */
export async function readJson(req: Request, maxBytes = 32_768): Promise<unknown | null> {
  const len = req.headers.get("content-length");
  if (len && Number(len) > maxBytes) return null;
  try {
    return await req.json();
  } catch {
    return null;
  }
}
