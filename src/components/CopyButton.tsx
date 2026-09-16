"use client";

import { useEffect, useRef, useState } from "react";

type Status = "idle" | "copied" | "error";

/**
 * زر النسخ.
 *
 * clipboard.writeText يحتاج سياقًا آمنًا (https أو localhost)؛ نرجع عند
 * فشله إلى طريقة execCommand القديمة حتى يعمل الزر على http في الشبكة
 * المحلية أيضًا.
 */
export function CopyButton({
  value,
  label = "نسخ",
  className = "btn-copy",
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copy() {
    let done = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        done = true;
      }
    } catch {
      done = false;
    }

    if (!done) done = legacyCopy(value);

    setStatus(done ? "copied" : "error");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={className}
      aria-live="polite"
      data-status={status}
    >
      {status === "copied" ? (
        <>
          <CheckIcon /> تم النسخ
        </>
      ) : status === "error" ? (
        <>تعذّر النسخ — انسخ يدويًا</>
      ) : (
        <>
          <CopyIcon /> {label}
        </>
      )}
    </button>
  );
}

function legacyCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const okResult = document.execCommand("copy");
    document.body.removeChild(ta);
    return okResult;
  } catch {
    return false;
  }
}

function CopyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M5 15V6a2 2 0 0 1 2-2h8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="m5 13 4.5 4.5L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
