/**
 * تحقّق من *صيغة* الآيبان فقط (ISO 13616 + خانة تحقق mod-97).
 *
 * ⚠️ حدود هذا التحقق — مهم:
 * ينجح الفحص إذا كانت السلسلة آيبانًا صحيح البنية والخانة الرقابية.
 * لا يعني ذلك أن الحساب موجود، ولا أنه نشِط، ولا أنه يعود لمن أدخله.
 * التحقق من الملكية يتطلّب تكاملًا بنكيًا خارج نطاق هذه المنصة.
 */

/** أطوال الآيبان المعتمدة لدول الخليج والدول الشائعة */
const IBAN_LENGTHS: Record<string, number> = {
  SA: 24, AE: 23, KW: 30, BH: 22, QA: 29, OM: 23,
  EG: 29, JO: 30, LB: 28, TR: 26,
  GB: 22, DE: 22, FR: 27, NL: 18, ES: 24, IT: 27,
  CH: 21, SE: 24, NO: 15, DK: 18, BE: 16, AT: 20,
  PT: 25, IE: 22, PL: 28, RO: 24, GR: 27, FI: 18,
};

export type IbanCheck =
  | { valid: true; normalized: string; country: string }
  | { valid: false; reason: string };

/** إزالة المسافات والشرطات ورفع الحروف */
export function normalizeIban(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase();
}

export function validateIban(input: string): IbanCheck {
  const iban = normalizeIban(input);

  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(iban)) {
    return { valid: false, reason: "صيغة الآيبان غير صحيحة (يبدأ برمز دولة ثم رقمين)" };
  }

  const country = iban.slice(0, 2);
  const expected = IBAN_LENGTHS[country];

  if (expected === undefined) {
    return { valid: false, reason: `رمز الدولة «${country}» غير مدعوم` };
  }
  if (iban.length !== expected) {
    return {
      valid: false,
      reason: `طول الآيبان لدولة ${country} يجب أن يكون ${expected} خانة (أدخلت ${iban.length})`,
    };
  }
  if (!mod97(iban)) {
    return { valid: false, reason: "خانة التحقق غير مطابقة — راجع الأرقام" };
  }

  return { valid: true, normalized: iban, country };
}

/**
 * خوارزمية mod-97-10: ننقل أول 4 خانات للنهاية، نحوّل الحروف إلى أرقام
 * (A=10 … Z=35)، ثم نحسب الباقي على 97 بالتقطيع لتفادي تجاوز حدود الأعداد.
 */
function mod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  let remainder = 0;
  for (const char of rearranged) {
    const code = char.charCodeAt(0);
    const chunk =
      code >= 65 && code <= 90
        ? String(code - 55) // A-Z → 10-35
        : char; // 0-9

    for (const digit of chunk) {
      remainder = (remainder * 10 + (digit.charCodeAt(0) - 48)) % 97;
    }
  }
  return remainder === 1;
}

/** تنسيق الآيبان في مجموعات رباعية للعرض: SA03 8000 0000 6080 1016 7519 */
export function formatIban(iban: string): string {
  return normalizeIban(iban).replace(/(.{4})/g, "$1 ").trim();
}

/** أرقام الحسابات: أرقام فقط، 6–34 خانة */
export function validateAccountNumber(input: string): { valid: boolean; reason?: string } {
  const cleaned = input.replace(/[\s-]/g, "");
  if (!/^[0-9]{6,34}$/.test(cleaned)) {
    return { valid: false, reason: "رقم الحساب يجب أن يكون بين 6 و34 رقمًا" };
  }
  return { valid: true };
}

/**
 * أرقام المحافظ: تُقبل الصيغة الدولية (+9665…) أو المحلية (05…).
 * نُطبّع إلى صيغة دولية بلا مسافات.
 */
export function validateWalletNumber(input: string): {
  valid: boolean;
  normalized?: string;
  reason?: string;
} {
  const cleaned = input.replace(/[\s-()]/g, "");

  if (/^05[0-9]{8}$/.test(cleaned)) {
    return { valid: true, normalized: `+966${cleaned.slice(1)}` };
  }
  if (/^\+?[0-9]{8,15}$/.test(cleaned)) {
    return { valid: true, normalized: cleaned.startsWith("+") ? cleaned : `+${cleaned}` };
  }
  return { valid: false, reason: "رقم المحفظة غير صالح (مثال: 05xxxxxxxx أو +9665xxxxxxxx)" };
}
