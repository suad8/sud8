import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * حدّ الاحتفاظ — نظام حماية البيانات الشخصية يوجب إتلاف البيانات حين
 * ينتهي الغرض منها.
 *
 * يحذف: الرموز المنتهية أو المستهلكة، الجلسات المنتهية، وسجل التدقيق
 * الأقدم من سنة.
 *
 * يُستدعى بجدولة خارجية (Railway Cron أو أي مُجدوِل) مع ترويسة
 * `x-cron-key` تطابق APP_SECRET. بلا مفتاح صحيح يرد 404 — لا نكشف
 * حتى وجود المسار.
 */
export const dynamic = "force-dynamic";

const OTP_KEEP_HOURS = 24;
const AUDIT_KEEP_DAYS = 365;

function authorized(req: Request): boolean {
  const given = req.headers.get("x-cron-key") ?? "";
  if (!given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(env.APP_SECRET).digest();
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return new Response("Not found", { status: 404 });
  }

  const now = new Date();
  const otpCutoff = new Date(now.getTime() - OTP_KEEP_HOURS * 3_600_000);
  const auditCutoff = new Date(now.getTime() - AUDIT_KEEP_DAYS * 86_400_000);

  const [otps, sessions, logs] = await Promise.all([
    db.otpCode.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: otpCutoff } }, { consumedAt: { lt: otpCutoff } }],
      },
    }),
    db.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    db.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } }),
  ]);

  return Response.json({
    ok: true,
    deleted: { otpCodes: otps.count, sessions: sessions.count, auditLogs: logs.count },
    at: now.toISOString(),
  });
}
