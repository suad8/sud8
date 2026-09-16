import { db } from "@/lib/db";
import { getProvider } from "@/lib/payments";

/**
 * ويب هوك بوابة الدفع.
 *
 * ⚠️ هذا المسار عام (تناديه البوابة، لا المتصفح) فلا يمر بفحص الأصل ولا
 * بالجلسة. الحماية الوحيدة هي **توقيع الحمولة**: نقرأ الجسم خامًا،
 * نتحقق من التوقيع بمقارنة ثابتة الزمن، ولا نلمس قاعدة البيانات قبل ذلك.
 */
export async function POST(req: Request) {
  const provider = getProvider();

  // لا بد من قراءة الجسم خامًا — أي JSON.parse قبل التحقق يبطل التوقيع
  const rawBody = await req.text();

  const signature =
    req.headers.get("x-signature") ??
    req.headers.get("x-moyasar-signature") ??
    req.headers.get("stripe-signature");

  const event = provider.parseWebhook(rawBody, signature);

  if (!event) {
    // لا نكشف السبب — توقيع خاطئ ومزوّد غير مفعّل يردّان نفس الشيء
    return new Response("Invalid signature", { status: 400 });
  }

  const subscription = await db.subscription.findUnique({
    where: { providerRef: event.providerRef },
    select: { id: true, userId: true, status: true, periodMonths: true },
  });

  if (!subscription) {
    // نرد 200 حتى لا تعيد البوابة المحاولة إلى ما لا نهاية
    return new Response("OK", { status: 200 });
  }

  // idempotency: تجاهل الأحداث المكرّرة على اشتراك مفعّل
  if (subscription.status === "ACTIVE" && event.status === "paid") {
    return new Response("OK", { status: 200 });
  }

  if (event.status === "paid") {
    const periodEnd = new Date(Date.now() + subscription.periodMonths * 30 * 86_400_000);

    await db.$transaction([
      db.subscription.update({
        where: { id: subscription.id },
        data: { status: "ACTIVE", currentPeriodEnd: periodEnd },
      }),
      db.user.update({
        where: { id: subscription.userId },
        data: { plan: "PRO", planExpiresAt: periodEnd },
      }),
      db.auditLog.create({
        data: {
          action: "subscription.activated",
          target: subscription.userId,
          meta: JSON.stringify({ providerRef: event.providerRef }),
        },
      }),
    ]);
  } else {
    await db.subscription.update({
      where: { id: subscription.id },
      data: { status: event.status === "failed" ? "FAILED" : "CANCELED" },
    });
  }

  return new Response("OK", { status: 200 });
}
