import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, ok, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";
import { getProvider, proPrice } from "@/lib/payments";
import { env } from "@/lib/env";

/**
 * بدء شراء اشتراك PRO.
 *
 * النطاق: اشتراك المنصة فقط. لا علاقة لهذا المسار بأي تحويل بين الزائر
 * وصاحب الصفحة — المنصة لا تمسّ أموال المستخدمين إطلاقًا.
 */
export async function POST() {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.writePerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  if (user.plan === "PRO") {
    return fail("أنت مشترك في PRO بالفعل", 400);
  }

  const provider = getProvider();
  const { amount, currency } = proPrice();

  const result = await provider.createCheckout({
    userId: user.id,
    email: user.email,
    amountHalalas: amount,
    currency,
    returnUrl: `${env.APP_URL.replace(/\/$/, "")}/dashboard/billing`,
  });

  await db.subscription.create({
    data: {
      userId: user.id,
      plan: "PRO",
      status: result.activatedImmediately ? "ACTIVE" : "PENDING",
      provider: provider.id,
      providerRef: result.providerRef,
      amount,
      currency,
      periodMonths: 1,
      currentPeriodEnd: result.activatedImmediately
        ? new Date(Date.now() + 30 * 86_400_000)
        : null,
    },
  });

  if (result.activatedImmediately) {
    await db.user.update({
      where: { id: user.id },
      data: { plan: "PRO", planExpiresAt: new Date(Date.now() + 30 * 86_400_000) },
    });
  }

  return ok({
    redirectUrl: result.redirectUrl,
    pending: !result.activatedImmediately,
    message: result.redirectUrl
      ? "جارٍ تحويلك إلى بوابة الدفع…"
      : "سجّلنا طلبك. سيُفعّل الاشتراك بعد مراجعة الإدارة.",
  });
}
