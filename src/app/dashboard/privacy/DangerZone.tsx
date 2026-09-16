"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PHRASE = "حذف حسابي";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.fields?.confirm ?? data.message ?? "تعذّر الحذف");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card border-danger-200 p-5">
      <h2 className="h-section text-danger-700">حذف الحساب</h2>
      <p className="mt-1.5 text-sm text-neutral-600">
        يمحو حسابك وصفحتك وكل حساباتك البنكية وصورك وجلساتك نهائيًا. رابط
        صفحتك يتوقف فورًا ويصير متاحًا لغيرك.
        <strong className="text-danger-700"> لا يمكن التراجع.</strong>
      </p>

      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="btn-danger mt-4">
          حذف حسابي
        </button>
      ) : (
        <form onSubmit={remove} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor="confirm" className="label">
              اكتب «{PHRASE}» للتأكيد
            </label>
            <input
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
              autoComplete="off"
              placeholder={PHRASE}
              aria-invalid={Boolean(error)}
            />
          </div>

          {error && <p role="alert" className="error-text">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || confirm !== PHRASE}
              className="btn-danger"
            >
              {busy ? "جارٍ الحذف…" : "احذف نهائيًا"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setConfirm(""); setError(null); }}
              className="btn-ghost"
            >
              إلغاء
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
