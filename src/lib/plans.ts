import { env } from "./env";
import type { Plan } from "@prisma/client";

/**
 * تعريف الباقات. كل الحدود والأسعار تُقرأ من متغيرات البيئة،
 * فتعديلها لا يحتاج تغيير كود (راجع .env.example).
 */
export type PlanDef = {
  id: Plan;
  name: string;
  priceHalalas: number;
  currency: string;
  maxAccounts: number;
  themes: readonly string[];
  customColors: boolean;
  removeBranding: boolean;
  features: readonly string[];
};

/**
 * الثيمات — كل واحد مأخوذ من تركيبة ألوان في ورقة الملصقات المرجعية.
 * «ورقي» هو الافتراضي ويطابق واجهة التطبيق نفسها.
 */
export const THEMES = [
  { id: "paper", name: "ورقي", free: true },
  { id: "sky", name: "سماوي", free: false },
  { id: "saffron", name: "زعفراني", free: false },
  { id: "seafoam", name: "نعناعي", free: false },
  { id: "blossom", name: "وردي", free: false },
  { id: "night", name: "ليلي", free: false },
] as const;

export const DEFAULT_THEME = "paper";

/**
 * ترحيل معرّفات الثيمات القديمة.
 * الصفحات المحفوظة قبل تغيير اللوحة تحمل معرّفات لم تعد معرّفة؛ بدون هذا
 * كانت ستُعرض بلا رموز لون إطلاقًا. نطبّعها عند القراءة بدل الاعتماد على
 * ترحيل لمرة واحدة في قاعدة البيانات.
 */
const LEGACY_THEMES: Record<string, string> = {
  sand: "saffron",
  // «mint» القديم كان الثيم الافتراضي المجاني — يُرحَّل إلى «ورقي» لا إلى
  // ثيم PRO، وإلا مُنح مستخدمو الباقة المجانية ثيمًا لا يملكونه
  mint: "paper",
  rose: "blossom",
};

export function normalizeTheme(theme: string): string {
  // ALL_THEMES مُستنتج كاتحاد ضيّق، والقيمة القادمة من قاعدة البيانات
  // نص حر — نوسّع النوع للمقارنة بدل تضييق المدخل
  if ((ALL_THEMES as readonly string[]).includes(theme)) return theme;
  return LEGACY_THEMES[theme] ?? DEFAULT_THEME;
}

export const FREE_THEMES = THEMES.filter((t) => t.free).map((t) => t.id);
export const ALL_THEMES = THEMES.map((t) => t.id);

export const PLANS: Record<Plan, PlanDef> = {
  FREE: {
    id: "FREE",
    name: "المجانية",
    priceHalalas: 0,
    currency: env.PRO_CURRENCY,
    maxAccounts: env.FREE_MAX_ACCOUNTS,
    themes: FREE_THEMES,
    customColors: false,
    removeBranding: false,
    features: [
      `حتى ${env.FREE_MAX_ACCOUNTS} حسابات`,
      "صفحة عامة برابط ثابت",
      "رمز QR قابل للتنزيل",
      "ثيم أساسي واحد",
    ],
  },
  PRO: {
    id: "PRO",
    name: "PRO",
    priceHalalas: env.PRO_PRICE_HALALAS,
    currency: env.PRO_CURRENCY,
    maxAccounts: env.PRO_MAX_ACCOUNTS,
    themes: ALL_THEMES,
    customColors: true,
    removeBranding: true,
    features: [
      `حتى ${env.PRO_MAX_ACCOUNTS} حسابًا`,
      "كل الثيمات",
      "لون مخصص للهوية",
      "إزالة علامة «حوّل»",
      "رمز QR قابل للتنزيل",
    ],
  },
};

export function planOf(plan: Plan): PlanDef {
  return PLANS[plan];
}

/** سعر معروض بالريال */
export function formatPrice(halalas: number, currency: string): string {
  if (halalas === 0) return "مجانًا";
  const amount = halalas / 100;
  const shown = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return `${shown} ${currency === "SAR" ? "ر.س" : currency}`;
}

/** هل يملك المستخدم صلاحية استخدام ثيم معيّن؟ */
export function canUseTheme(plan: Plan, theme: string): boolean {
  return PLANS[plan].themes.includes(theme);
}
