import { z } from "zod";
import { ALL_THEMES } from "./plans";
import { MAX_CSS_LENGTH } from "./css";
import { normalizeIban, validateAccountNumber, validateIban, validateWalletNumber } from "./iban";

/** أسماء مستخدمين محجوزة — تمنع انتحال مسارات المنصة */
const RESERVED_USERNAMES = new Set([
  "admin", "administrator", "api", "app", "auth", "billing", "blog", "contact",
  "dashboard", "docs", "help", "hawwil", "home", "login", "logout", "me",
  "new", "pricing", "privacy", "root", "settings", "signin", "signup",
  "support", "system", "terms", "u", "user", "users", "www",
]);

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "اسم المستخدم قصير جدًا (3 أحرف على الأقل)")
  .max(30, "اسم المستخدم طويل جدًا (30 حرفًا كحد أقصى)")
  .regex(/^[a-z0-9_]+$/, "يُسمح بالحروف الإنجليزية الصغيرة والأرقام والشرطة السفلية فقط")
  .regex(/^[a-z0-9]/, "يجب أن يبدأ بحرف أو رقم")
  .refine((v) => !RESERVED_USERNAMES.has(v), "هذا الاسم محجوز، اختر غيره");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("صيغة البريد الإلكتروني غير صحيحة")
  .max(254);

export const otpSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "الرمز يتكون من 6 أرقام");

export const requestOtpSchema = z.object({ email: emailSchema });

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: otpSchema,
});

export const pageSettingsSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "الاسم قصير جدًا")
    .max(60, "الاسم طويل جدًا (60 حرفًا كحد أقصى)"),
  bio: z.string().trim().max(160, "الوصف طويل جدًا (160 حرفًا كحد أقصى)").optional().or(z.literal("")),
  username: usernameSchema,
  theme: z.enum(ALL_THEMES as [string, ...string[]]),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "اللون يجب أن يكون بصيغة #RRGGBB")
    .optional()
    .or(z.literal("")),
  hideBranding: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  customCss: z
    .string()
    .max(MAX_CSS_LENGTH, `الحد الأقصى ${MAX_CSS_LENGTH} حرف`)
    .optional()
    .or(z.literal("")),
});

/**
 * مخطط الحساب البنكي/المحفظة.
 * التحقق من القيمة يعتمد على `valueType`، ونطبّع القيمة قبل التخزين
 * حتى يظهر الآيبان ورقم المحفظة بصيغة موحّدة للزائر.
 */
export const accountSchema = z
  .object({
    kind: z.enum(["BANK", "WALLET"]),
    provider: z.string().trim().min(2, "اسم البنك أو المحفظة مطلوب").max(60),
    beneficiary: z.string().trim().min(2, "اسم المستفيد مطلوب").max(80),
    valueType: z.enum(["IBAN", "ACCOUNT_NUMBER", "WALLET_NUMBER"]),
    value: z.string().trim().min(4, "البيانات مطلوبة").max(64),
    note: z.string().trim().max(100).optional().or(z.literal("")),
    isHidden: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.valueType === "IBAN") {
      const res = validateIban(data.value);
      if (!res.valid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["value"], message: res.reason });
      }
    } else if (data.valueType === "ACCOUNT_NUMBER") {
      const res = validateAccountNumber(data.value);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: res.reason ?? "رقم حساب غير صالح",
        });
      }
    } else {
      const res = validateWalletNumber(data.value);
      if (!res.valid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: res.reason ?? "رقم محفظة غير صالح",
        });
      }
    }
  })
  .transform((data) => {
    let value = data.value;
    if (data.valueType === "IBAN") {
      value = normalizeIban(value);
    } else if (data.valueType === "ACCOUNT_NUMBER") {
      value = value.replace(/[\s-]/g, "");
    } else {
      value = validateWalletNumber(value).normalized ?? value;
    }
    return { ...data, value };
  });

export const reorderSchema = z.object({
  ids: z.array(z.string().cuid()).min(1).max(100),
});

export const adminUserActionSchema = z.object({
  userId: z.string().cuid(),
  action: z.enum(["suspend", "activate", "block_page", "unblock_page", "set_plan"]),
  reason: z.string().trim().max(200).optional(),
  plan: z.enum(["FREE", "PRO"]).optional(),
});

/** تحويل أخطاء zod إلى خريطة حقل → رسالة، جاهزة للعرض */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
