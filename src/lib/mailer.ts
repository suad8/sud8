import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env, isProd } from "./env";

/**
 * إرسال البريد.
 *
 * بدون إعداد SMTP يُطبع الرمز في طرفية الخادم — مفيد للتطوير، ومرفوض في
 * الإنتاج (نرمي خطأ صراحةً بدل إرسال صامت يفشل).
 *
 * لتفعيل الإرسال الحقيقي: عبّئ SMTP_HOST و SMTP_PORT و SMTP_FROM في .env
 * (و SMTP_USER/SMTP_PASS إن كان المزوّد يطلب مصادقة). لا خطوة أخرى.
 */

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

export async function sendMail(msg: MailMessage): Promise<void> {
  const configured = Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);

  if (!configured) {
    if (isProd) {
      throw new Error(
        "إعداد SMTP ناقص. لا يمكن إرسال البريد في الإنتاج — راجع SMTP_* في .env",
      );
    }
    // وضع التطوير: اطبع الرسالة بدل إرسالها
    console.log(
      [
        "",
        "╭─────────────────── بريد (وضع التطوير) ───────────────────",
        `│ إلى:     ${msg.to}`,
        `│ الموضوع: ${msg.subject}`,
        "│",
        ...msg.text.split("\n").map((l) => `│ ${l}`),
        "╰──────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return;
  }

  await sendViaSmtp(msg);
}

/**
 * ناقل واحد يُعاد استخدامه عبر الطلبات. إنشاء ناقل جديد لكل رسالة يفتح
 * اتصال SMTP جديدًا في كل مرة، وهو بطيء وقد يصطدم بحدود المزوّد.
 */
let transport: Transporter | null = null;

function getTransport(): Transporter {
  if (transport) return transport;

  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // المنفذ 465 يبدأ TLS فورًا؛ 587 و25 يرقّيان عبر STARTTLS
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    pool: true,
    maxConnections: 3,
  });

  return transport;
}

async function sendViaSmtp(msg: MailMessage): Promise<void> {
  try {
    await getTransport().sendMail({
      from: env.SMTP_FROM,
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
  } catch (cause) {
    // نسجّل السبب للمشغّل ولا نمرّره للمستخدم — قد يكشف بيانات المزوّد
    console.error("[mailer] فشل إرسال البريد:", cause);
    throw new Error("تعذّر إرسال البريد");
  }
}

export function otpEmail(code: string): Omit<MailMessage, "to"> {
  return {
    subject: `رمز الدخول إلى حوّل: ${code}`,
    text: [
      "مرحبًا،",
      "",
      `رمز الدخول الخاص بك هو: ${code}`,
      "",
      "الرمز صالح لمدة 10 دقائق ولمرة واحدة فقط.",
      "إذا لم تطلب هذا الرمز فتجاهل الرسالة — لن يحدث شيء لحسابك.",
      "",
      "— فريق حوّل",
    ].join("\n"),
  };
}
