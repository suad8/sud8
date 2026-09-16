import { z } from "zod";

/**
 * التحقق من متغيرات البيئة عند الإقلاع. الفشل هنا أفضل من فشل صامت
 * في الإنتاج بسر ناقص أو مفتاح ضعيف.
 */
/**
 * المتغيّرات الاختيارية تُترك فارغة في .env، ودالة التحويل تعامل النص
 * الفارغ كقيمة موجودة: `z.coerce.number()` تحوّل "" إلى 0 فيسقط في
 * `.positive()`، و`.optional()` لا تنقذ لأن القيمة ليست undefined.
 * نطبّع "" إلى undefined قبل التحقق حتى يعمل .env.example كما هو.
 */
const blankToUndefined = (v: unknown) => (v === "" ? undefined : v);

const optionalText = z.preprocess(blankToUndefined, z.string().optional());

const optionalPort = z.preprocess(
  blankToUndefined,
  z.coerce.number().int().positive().optional(),
);

/** عدد موجب بقيمة افتراضية — الفراغ يعني «استخدم الافتراضي» */
const countWithDefault = (fallback: number) =>
  z.preprocess(blankToUndefined, z.coerce.number().int().positive().default(fallback));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL مطلوب"),

  // سر توقيع/اشتقاق داخلي. 32 بايت على الأقل.
  APP_SECRET: z
    .string()
    .min(32, "APP_SECRET يجب أن يكون 32 حرفًا فأكثر — ولّده بـ: openssl rand -hex 32"),

  APP_URL: z.preprocess(blankToUndefined, z.string().url().default("http://localhost:3000")),

  // البريد — إن لم يُضبط SMTP تُطبع الرموز في الطرفية (وضع التطوير فقط)
  SMTP_HOST: optionalText,
  SMTP_PORT: optionalPort,
  SMTP_USER: optionalText,
  SMTP_PASS: optionalText,
  SMTP_FROM: optionalText,

  // بوابة الدفع — "manual" يفعّل الوضع اليدوي بدون بوابة خارجية
  PAYMENTS_PROVIDER: z.enum(["manual", "moyasar", "tap", "stripe"]).default("manual"),
  PAYMENTS_SECRET_KEY: optionalText,
  PAYMENTS_WEBHOOK_SECRET: optionalText,

  // حدود الباقات والأسعار — كلها قابلة للتعديل من البيئة
  FREE_MAX_ACCOUNTS: countWithDefault(3),
  PRO_MAX_ACCOUNTS: countWithDefault(30),
  PRO_PRICE_HALALAS: z.preprocess(blankToUndefined, z.coerce.number().int().nonnegative().default(2900)),
  PRO_CURRENCY: z.preprocess(blankToUndefined, z.string().default("SAR")),

  // بريد أول مدير — يُرقّى تلقائيًا عند التسجيل
  ADMIN_EMAILS: z.preprocess((v) => v ?? "", z.string().default("")),
});

/**
 * Railway يحقن اسم النطاق العام في RAILWAY_PUBLIC_DOMAIN بعد أول نشر،
 * فلا يعرفه المستخدم وقت ضبط المتغيّرات. نشتقّ APP_URL منه تلقائيًا حين
 * لا يُضبط صراحةً — وهو مهم لأن فحص CSRF وروابط QR يعتمدان عليه.
 */
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;

const source = {
  ...process.env,
  APP_URL:
    process.env.APP_URL ||
    (railwayDomain ? `https://${railwayDomain}` : undefined),
};

const parsed = schema.safeParse(source);

/**
 * لا نرمي خطأ هنا.
 *
 * الرمي عند تحميل الوحدة يُسقط العملية بأكملها، فلا يبقى شيء يستمع على
 * المنفذ — والنتيجة صفحة «لم يصل القطار» من المستضيف، وهي لا تقول شيئًا
 * عن السبب. بدلًا من ذلك نسجّل ما نقص، ويعرض التطبيق صفحة إعداد تسمّي
 * المتغيّر الناقص بالضبط. الفشل يبقى ظاهرًا، لكنه صار قابلًا للتشخيص.
 */
export const envIssues: string[] = parsed.success
  ? []
  : parsed.error.issues.map((i) => `${i.path.join(".") || "?"}: ${i.message}`);

if (envIssues.length > 0) {
  console.error(
    "\n⚠️  إعدادات البيئة غير صالحة:\n" +
      envIssues.map((i) => "  • " + i).join("\n") +
      "\n\nالتطبيق يعمل في وضع الإعداد — راجع .env.example\n",
  );
}

/** قيم احتياطية تُبقي الوحدات قابلة للاستيراد حتى مع نقص الإعداد */
const FALLBACK = {
  NODE_ENV: (process.env.NODE_ENV ?? "development") as "development" | "test" | "production",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  APP_SECRET: process.env.APP_SECRET ?? "",
  APP_URL: source.APP_URL ?? "http://localhost:3000",
  SMTP_HOST: undefined,
  SMTP_PORT: undefined,
  SMTP_USER: undefined,
  SMTP_PASS: undefined,
  SMTP_FROM: undefined,
  PAYMENTS_PROVIDER: "manual" as const,
  PAYMENTS_SECRET_KEY: undefined,
  PAYMENTS_WEBHOOK_SECRET: undefined,
  FREE_MAX_ACCOUNTS: 3,
  PRO_MAX_ACCOUNTS: 30,
  PRO_PRICE_HALALAS: 2900,
  PRO_CURRENCY: "SAR",
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",
} satisfies z.infer<typeof schema>;

export const env: z.infer<typeof schema> = parsed.success ? parsed.data : FALLBACK;

export const isProd = env.NODE_ENV === "production";

/** قائمة بُرد المدراء بحروف صغيرة */
export const adminEmails = env.ADMIN_EMAILS.split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
