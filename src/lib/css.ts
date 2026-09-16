/**
 * تعقيم CSS الذي يكتبه صاحب الصفحة.
 *
 * الصفحة العامة تعرض أرقام حسابات بنكية، فـ CSS حر ليس مسألة تصميم فقط:
 *
 *  • `</style>` يكسر الوسم ويحوّل الأمر إلى حقن HTML كامل
 *  • `url(https://…)` و`@import` يسرّبان IP كل زائر لخادم خارجي
 *  • إخفاء تنبيه «لا نتحقق من الملكية» يزيل حماية الزائر
 *  • `position: fixed` يسمح بطبقة فوق رقم حقيقي لتبديله بصريًا
 *
 * فنسمح بالتصميم ونمنع هذه الأربعة تحديدًا.
 */

export const MAX_CSS_LENGTH = 8000;

/** عناصر لا يجوز للمستخدم إخفاؤها — تُعاد بعد كوده */
const PROTECTED = [".hawwil-notice", ".hawwil-brand"];

export type CssCheck = {
  css: string;
  removed: string[];
};

export function sanitizeCss(input: string): CssCheck {
  const removed: string[] = [];
  let css = input.slice(0, MAX_CSS_LENGTH);

  // 1) لا خروج من وسم <style> بأي حال
  if (/[<>]/.test(css)) {
    css = css.replace(/[<>]/g, "");
    removed.push("رموز < و > غير مسموحة");
  }

  // 2) @import يجلب أنماطًا من الخارج ويسرّب الزائر
  if (/@import/i.test(css)) {
    css = css.replace(/@import[^;]*;?/gi, "");
    removed.push("@import");
  }

  // 3) url() خارجية. نسمح بـ data: للصور المضمّنة وبمسارات الموقع نفسه
  css = css.replace(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi, (match, _q, raw: string) => {
    const v = raw.trim();
    if (v.startsWith("data:image/") || v.startsWith("/")) return match;
    removed.push(`رابط خارجي: ${v.slice(0, 40)}`);
    return "none";
  });

  // 4) مسارات تنفيذ قديمة لا تزال مدعومة في بعض المحركات
  if (/expression\s*\(|behavior\s*:|-moz-binding/i.test(css)) {
    css = css
      .replace(/expression\s*\([^)]*\)/gi, "")
      .replace(/behavior\s*:[^;]*;?/gi, "")
      .replace(/-moz-binding\s*:[^;]*;?/gi, "");
    removed.push("خصائص تنفيذ غير آمنة");
  }

  // 5) fixed يخرج من حدود البطاقة ويسمح بطبقة فوق الأرقام
  if (/position\s*:\s*fixed/i.test(css)) {
    css = css.replace(/position\s*:\s*fixed/gi, "position:static");
    removed.push("position: fixed");
  }

  return { css: css.trim(), removed };
}

/**
 * قواعد تُحقن **بعد** كود المستخدم فتغلب عليه، وتضمن بقاء التنبيه
 * والعلامة مرئيين مهما كتب.
 */
export function protectionCss(): string {
  const sel = PROTECTED.join(",");
  return `${sel}{display:block!important;visibility:visible!important;opacity:1!important;` +
    `position:static!important;height:auto!important;max-height:none!important;` +
    `overflow:visible!important;font-size:12px!important;clip-path:none!important;` +
    `transform:none!important;pointer-events:auto!important}`;
}
