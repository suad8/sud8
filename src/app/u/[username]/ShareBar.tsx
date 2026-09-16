"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

/**
 * شريط المشاركة: نسخ الرابط، مشاركة عبر واجهة النظام، وعرض/تنزيل QR.
 *
 * نبني الرابط من window.location في العميل حتى يعمل على أي نطاق أو منفذ
 * بلا اعتماد على إعداد الخادم.
 */
export function ShareBar({
  username,
  displayName,
}: {
  username: string;
  displayName: string;
}) {
  const [url, setUrl] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/u/${username}`);
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, [username]);

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          {/* نسخة هادئة — نسخ الرابط إجراء ثانوي مقابل نسخ بيانات الحساب */}
          <CopyButton value={url} label="نسخ الرابط" className="btn-copy-quiet" />
        </div>

        {canShare && (
          <IconButton label="مشاركة" onClick={() => navigator.share({ title: displayName, url }).catch(() => {})}>
            <ShareIcon />
          </IconButton>
        )}

        <IconButton label="رمز QR" expanded={showQr} onClick={() => setShowQr((v) => !v)}>
          <QrIcon />
        </IconButton>
      </div>

      {showQr && (
        <div className="themed-card mt-2 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/qr/${username}`}
            alt={`رمز QR لصفحة ${displayName}`}
            className="mx-auto h-44 w-44"
            width={176}
            height={176}
          />
          <a
            href={`/api/qr/${username}?format=png`}
            download
            className="mt-2 inline-block text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            تنزيل الرمز (PNG)
          </a>
        </div>
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  expanded,
  children,
}: {
  label: string;
  onClick: () => void;
  expanded?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-expanded={expanded}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition hover:opacity-75"
      style={{
        background: "color-mix(in srgb, var(--fg) 7%, transparent)",
        color: "var(--fg)",
      }}
    >
      {children}
    </button>
  );
}

function ShareIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v13M12 3 8 7m4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <path d="M14 14h3v3h-3zM18 18h3v3h-3z" fill="currentColor" />
    </svg>
  );
}
