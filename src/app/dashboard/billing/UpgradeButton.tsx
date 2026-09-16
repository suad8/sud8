"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UpgradeButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setBusy(true);
    setError(null);
    setMsg(null);

    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "تعذّر بدء عملية الاشتراك");
        return;
      }

      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      setMsg(data.message);
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={upgrade} disabled={busy} className="btn-primary w-full">
        {busy ? "جارٍ المعالجة…" : "الاشتراك في PRO"}
      </button>

      {msg && (
        <p role="status" className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          {msg}
        </p>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
