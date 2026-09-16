/**
 * هوية «حوّل».
 *
 * فكرة الرمز: ثلاثة مسارات (حسابات متفرقة) تنساب وتلتقي في نقطة واحدة
 * (الرابط). يقرأ يمينًا→يسارًا مثل النص العربي، ويبقى مفهومًا عند 16px.
 * لا حرف لاتيني فيه — العلامة عربية والرمز مجرّد.
 */

/** الرمز وحده — يرث اللون من المحيط، فيصلح على أي خلفية. */
export function Glyph({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* خطوط مستقيمة فقط — تُرسَم حادّة عند 16px بعكس المنحنيات التي
          تتضبّب. بين رأس السهم والنقطة فجوة مقصودة (15.5 مقابل 12.7)
          تُبقيهما عنصرين منفصلين: سهم يصبّ في نقطة، لا كتلة واحدة. */}
      <g
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M25.5 16h-10" />
        <path d="M21 11l-5.5 5 5.5 5" />
      </g>
      <circle cx="9.5" cy="16" r="3.2" fill="currentColor" />
    </svg>
  );
}

/** الرمز داخل مربّع العلامة — للهيدر والأيقونة والصورة البديلة. */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white"
      style={{ width: size, height: size }}
    >
      <Glyph size={Math.round(size * 0.72)} />
    </span>
  );
}

/** العلامة الكاملة: الرمز + الاسم. */
export function Wordmark({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <Logo size={size} />
      <span className="text-lg font-bold tracking-tight text-neutral-900">حوّل</span>
    </span>
  );
}
