import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import type { Plan, Role, UserStatus } from "@prisma/client";
import { db } from "./db";
import { generateSessionToken, hashIp, hashSessionToken } from "./crypto";
import { isProd } from "./env";

export const SESSION_COOKIE = "hawwil_session";
const SESSION_TTL_DAYS = 30;
/** نجدّد تاريخ الانتهاء إذا مضى أكثر من يوم على آخر ظهور */
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

export type SessionUser = {
  id: string;
  email: string;
  role: Role;
  plan: Plan;
  status: UserStatus;
  planExpiresAt: Date | null;
};

/**
 * إنشاء جلسة وتثبيت الكوكي.
 * الكوكي: httpOnly (لا وصول من JS)، secure في الإنتاج،
 * sameSite=lax (يصدّ CSRF على طلبات POST عبر المواقع).
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  const hdrs = await headers();
  const ip = clientIp(hdrs);

  await db.session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      userAgent: hdrs.get("user-agent")?.slice(0, 255) ?? null,
      ipHash: ip ? hashIp(ip) : null,
    },
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

/**
 * قراءة المستخدم الحالي. مغلّفة بـ cache() فتُنفَّذ استعلامًا واحدًا
 * لكل طلب مهما تكرّر النداء عبر المكوّنات.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // الحساب الموقوف يفقد جلسته فورًا
  if (session.user.status === "SUSPENDED") return null;

  // تمديد كسول لتاريخ الانتهاء
  if (Date.now() - session.lastSeenAt.getTime() > REFRESH_AFTER_MS) {
    await db.session
      .update({
        where: { id: session.id },
        data: {
          lastSeenAt: new Date(),
          expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000),
        },
      })
      .catch(() => {});
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    plan: effectivePlan(session.user.plan, session.user.planExpiresAt),
    status: session.user.status,
    planExpiresAt: session.user.planExpiresAt,
  };
});

/** الباقة الفعلية بعد احتساب انتهاء الاشتراك */
export function effectivePlan(plan: Plan, expiresAt: Date | null): Plan {
  if (plan === "PRO" && expiresAt && expiresAt.getTime() < Date.now()) return "FREE";
  return plan;
}

/** حذف الجلسة الحالية من القاعدة والكوكي */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashSessionToken(token) } }).catch(() => {});
  }
  store.delete(SESSION_COOKIE);
}

/** إبطال كل جلسات مستخدم — يُستخدم عند الإيقاف الإداري */
export async function destroyAllSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } });
}

export function clientIp(hdrs: Headers): string | null {
  const fwd = hdrs.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() ?? null;
  return hdrs.get("x-real-ip");
}
