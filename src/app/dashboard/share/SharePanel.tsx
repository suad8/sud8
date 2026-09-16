"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/CopyButton";

export function SharePanel({
  username,
  displayName,
  enabled,
}: {
  username: string;
  displayName: string;
  enabled: boolean;
}) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/u/${username}`);
    setCanShare("share" in navigator);
  }, [username]);

  return (
    <div className="space-y-4">
      <section className="card p-5">
        <h2 className="font-bold text-neutral-900">رابطك</h2>
        <p className="ltr-nums mt-3 break-all rounded-xl bg-neutral-50 p-3 font-mono text-sm text-neutral-800">
          {url || "…"}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <div className="min-w-[160px] flex-1">
            <CopyButton value={url} label="نسخ الرابط" />
          </div>

          {canShare && (
            <button
              type="button"
              onClick={() =>
                navigator.share({ title: displayName, url }).catch(() => {})
              }
              className="btn-ghost"
            >
              مشاركة
            </button>
          )}

          <a href={`/u/${username}`} target="_blank" rel="noreferrer" className="btn-ghost">
            فتح
          </a>
        </div>
      </section>

      <section className="card p-5 text-center">
        <h2 className="font-bold text-neutral-900">رمز QR</h2>
        <p className="mt-1 text-sm text-neutral-500">اطبعه أو ضعه في ملفك الشخصي.</p>

        {enabled ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/qr/${username}`}
              alt={`رمز QR لصفحة ${displayName}`}
              className="mx-auto mt-4 h-52 w-52 rounded-xl border border-neutral-100"
              width={208}
              height={208}
            />
            <a
              href={`/api/qr/${username}?format=png`}
              download={`hawwil-${username}.png`}
              className="btn-primary mt-4"
            >
              تنزيل PNG
            </a>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-neutral-50 p-8 text-sm text-neutral-500">
            الرمز غير متاح لأن الصفحة غير منشورة.
          </p>
        )}
      </section>
    </div>
  );
}
