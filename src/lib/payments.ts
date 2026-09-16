import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "./env";
import { PLANS } from "./plans";

/**
 * طبقة دفع مجرّدة — للاشتراك في المنصة فقط.
 *
 * ⚠️ نطاق مقصود: هذه البوابة تشتري اشتراك «حوّل» ولا علاقة لها بأي تحويل
 * بين الزائر وصاحب الصفحة. المنصة لا تستقبل ولا توجّه ولا تتابع أموال
 * المستخدمين — تعرض بيانات حسابات فقط.
 *
 * المزوّد الافتراضي "manual": ينشئ اشتراكًا معلّقًا يفعّله المدير يدويًا.
 * يعمل بدون أي مفاتيح خارجية.
 */

export type CheckoutResult = {
  /** رابط يُوجَّه إليه المستخدم، أو null في الوضع اليدوي */
  redirectUrl: string | null;
  /** معرّف العملية لدى المزوّد */
  providerRef: string;
  /** هل فُعّل الاشتراك فورًا؟ */
  activatedImmediately: boolean;
};

export type PaymentProvider = {
  id: string;
  createCheckout(input: {
    userId: string;
    email: string;
    amountHalalas: number;
    currency: string;
    returnUrl: string;
  }): Promise<CheckoutResult>;
  /** يتحقق من توقيع الويب هوك ويعيد معرّف العملية وحالتها */
  parseWebhook(rawBody: string, signature: string | null): WebhookEvent | null;
};

export type WebhookEvent = {
  providerRef: string;
  status: "paid" | "failed" | "canceled";
};

// ─────────────────────────── الوضع اليدوي ───────────────────────────

const manualProvider: PaymentProvider = {
  id: "manual",
  async createCheckout({ userId }) {
    return {
      redirectUrl: null,
      providerRef: `manual_${userId}_${Date.now()}`,
      activatedImmediately: false,
    };
  },
  parseWebhook() {
    return null; // لا ويب هوك في الوضع اليدوي
  },
};

// ─────────────────────── هيكل مزوّد حقيقي (Moyasar) ───────────────────────

/**
 * مثال تكامل. المسارات والحقول مأخوذة من توثيق Moyasar العام؛
 * راجعها قبل التشغيل الفعلي وأضف اختبارات على بيئة الاختبار.
 */
const moyasarProvider: PaymentProvider = {
  id: "moyasar",
  async createCheckout({ email, amountHalalas, currency, returnUrl, userId }) {
    if (!env.PAYMENTS_SECRET_KEY) {
      throw new Error("PAYMENTS_SECRET_KEY مطلوب لتفعيل مزوّد moyasar");
    }

    const res = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.PAYMENTS_SECRET_KEY}:`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountHalalas,
        currency,
        description: `اشتراك حوّل PRO — ${email}`,
        callback_url: returnUrl,
        metadata: { userId },
      }),
    });

    if (!res.ok) {
      throw new Error(`فشل إنشاء عملية الدفع: ${res.status}`);
    }

    const data = (await res.json()) as { id: string; url: string };
    return { redirectUrl: data.url, providerRef: data.id, activatedImmediately: false };
  },

  parseWebhook(rawBody, signature) {
    const secret = env.PAYMENTS_WEBHOOK_SECRET;
    if (!secret || !signature) return null;

    // تحقق التوقيع بزمن ثابت — لا تثق بأي حمولة قبل هذا
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    try {
      const evt = JSON.parse(rawBody) as { data?: { id?: string; status?: string } };
      const id = evt.data?.id;
      const status = evt.data?.status;
      if (!id || !status) return null;

      return {
        providerRef: id,
        status: status === "paid" ? "paid" : status === "failed" ? "failed" : "canceled",
      };
    } catch {
      return null;
    }
  },
};

const PROVIDERS: Record<string, PaymentProvider> = {
  manual: manualProvider,
  moyasar: moyasarProvider,
  // tap / stripe: انسخ هيكل moyasar وبدّل نقاط النهاية وتحقق التوقيع
  tap: manualProvider,
  stripe: manualProvider,
};

export function getProvider(): PaymentProvider {
  return PROVIDERS[env.PAYMENTS_PROVIDER] ?? manualProvider;
}

export function proPrice() {
  return { amount: PLANS.PRO.priceHalalas, currency: PLANS.PRO.currency };
}
