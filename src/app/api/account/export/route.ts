import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/api";

/**
 * حق الوصول — المادة 4 من نظام حماية البيانات الشخصية.
 *
 * يسلّم صاحب البيانات نسخة كاملة مما تحتفظ به المنصة عنه، بصيغة
 * مقروءة آليًا. نستثني هاشات الجلسات والرموز: ليست بياناته الشخصية
 * بل أسرار أمنية، وتسليمها يضرّ به.
 */
export async function GET() {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const [record, sessions, subscriptions, logs] = await Promise.all([
    db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        page: {
          select: {
            username: true,
            displayName: true,
            bio: true,
            theme: true,
            accentColor: true,
            hideBranding: true,
            customCss: true,
            isPublished: true,
            isBlocked: true,
            blockReason: true,
            viewCount: true,
            createdAt: true,
            accounts: {
              select: {
                kind: true,
                provider: true,
                beneficiary: true,
                valueType: true,
                value: true,
                note: true,
                isHidden: true,
                sortOrder: true,
                createdAt: true,
              },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
        media: {
          select: { id: true, mimeType: true, size: true, width: true, height: true, createdAt: true },
        },
      },
    }),
    // الجلسات بلا الهاشات — نصف الجهاز لا نسلّم مفتاحه
    db.session.findMany({
      where: { userId: user.id },
      select: { createdAt: true, lastSeenAt: true, expiresAt: true, userAgent: true },
      orderBy: { createdAt: "desc" },
    }),
    db.subscription.findMany({
      where: { userId: user.id },
      select: {
        plan: true, status: true, provider: true, amount: true,
        currency: true, periodMonths: true, currentPeriodEnd: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.auditLog.findMany({
      where: { actorId: user.id },
      select: { action: true, target: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  if (!record) return NextResponse.json({ ok: false }, { status: 404 });

  const payload = {
    _معلومات: {
      الوصف: "نسخة كاملة من بياناتك الشخصية لدى منصة حوّل",
      الأساس: "حق الوصول — نظام حماية البيانات الشخصية (السعودية)",
      تاريخ_التصدير: new Date().toISOString(),
      ملاحظة:
        "الصور مستثناة من هذا الملف لحجمها؛ حمّلها من صفحتك مباشرة. " +
        "هاشات الجلسات ورموز التحقق مستثناة لأنها أسرار أمنية لا بيانات شخصية.",
    },
    الحساب: record,
    الجلسات: sessions,
    الاشتراكات: subscriptions,
    سجل_النشاط: logs,
  };

  const body = JSON.stringify(payload, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="hawwil-data-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
