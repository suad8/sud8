"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatIban } from "@/lib/iban";

export type AccountDraft = {
  id: string;
  kind: "BANK" | "WALLET";
  provider: string;
  beneficiary: string;
  valueType: "IBAN" | "ACCOUNT_NUMBER" | "WALLET_NUMBER";
  value: string;
  note: string | null;
  isHidden: boolean;
};

const TYPE_LABEL = {
  IBAN: "آيبان",
  ACCOUNT_NUMBER: "رقم حساب",
  WALLET_NUMBER: "رقم محفظة",
} as const;

const EMPTY: Omit<AccountDraft, "id"> = {
  kind: "BANK",
  provider: "",
  beneficiary: "",
  valueType: "IBAN",
  value: "",
  note: "",
  isHidden: false,
};

export function AccountsManager({
  initialAccounts,
  maxAccounts,
  planName,
}: {
  initialAccounts: AccountDraft[];
  maxAccounts: number;
  planName: string;
}) {
  const router = useRouter();
  const [accounts, setAccounts] = useState(initialAccounts);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const atLimit = accounts.length >= maxAccounts;

  function notify(type: "ok" | "err", text: string) {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), 4000);
  }

  async function save(draft: Omit<AccountDraft, "id">, id?: string) {
    setBusy(true);
    try {
      const res = await fetch(id ? `/api/accounts/${id}` : "/api/accounts", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();

      if (!res.ok) {
        return { error: data.fields?.value ?? data.message ?? "تعذّر الحفظ" };
      }

      if (id) {
        setAccounts((prev) => prev.map((a) => (a.id === id ? data.account : a)));
        notify("ok", "حُدّث الحساب");
      } else {
        setAccounts((prev) => [...prev, data.account]);
        notify("ok", "أُضيف الحساب");
      }
      setEditing(null);
      router.refresh();
      return {};
    } catch {
      return { error: "تعذّر الاتصال بالخادم" };
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا الحساب نهائيًا؟")) return;
    setBusy(true);
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setBusy(false);

    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== id));
      notify("ok", "حُذف الحساب");
      router.refresh();
    } else {
      notify("err", "تعذّر الحذف");
    }
  }

  async function toggleHidden(account: AccountDraft) {
    const next = { ...account, isHidden: !account.isHidden, note: account.note ?? "" };
    setAccounts((prev) => prev.map((a) => (a.id === account.id ? next : a)));

    const res = await fetch(`/api/accounts/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });

    if (!res.ok) {
      // تراجع بصري عند فشل الحفظ
      setAccounts((prev) => prev.map((a) => (a.id === account.id ? account : a)));
      notify("err", "تعذّر تغيير الإظهار");
    } else {
      router.refresh();
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= accounts.length) return;

    const next = [...accounts];
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    setAccounts(next);

    const res = await fetch("/api/accounts/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((x) => x.id) }),
    });

    if (!res.ok) {
      setAccounts(accounts);
      notify("err", "تعذّر حفظ الترتيب");
    } else {
      router.refresh();
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">حساباتك</h2>
          <p className="text-sm text-neutral-500">
            {accounts.length} من {maxAccounts} — باقة {planName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          disabled={atLimit || editing === "new"}
          className="btn-primary"
        >
          + إضافة حساب
        </button>
      </div>

      {atLimit && (
        <p className="note-warn">
          وصلت الحد الأقصى لباقتك.{" "}
          <a href="/dashboard/billing" className="font-bold underline">
            رقِّ إلى PRO
          </a>{" "}
          لإضافة حسابات أكثر.
        </p>
      )}

      {flash && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm font-medium ${
            flash.type === "ok"
              ? "bg-brand-50 text-brand-800"
              : "bg-danger-50 text-danger-700"
          }`}
        >
          {flash.text}
        </p>
      )}

      {editing === "new" && (
        <AccountForm
          initial={EMPTY}
          busy={busy}
          onCancel={() => setEditing(null)}
          onSave={(d) => save(d)}
        />
      )}

      {accounts.length === 0 && editing !== "new" ? (
        <div className="card p-10 text-center">
          <p className="font-semibold text-neutral-700">لا توجد حسابات بعد</p>
          <p className="mt-1 text-sm text-neutral-500">
            أضف أول حساب ليظهر في صفحتك العامة.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {accounts.map((account, i) =>
            editing === account.id ? (
              <li key={account.id}>
                <AccountForm
                  initial={{ ...account, note: account.note ?? "" }}
                  busy={busy}
                  onCancel={() => setEditing(null)}
                  onSave={(d) => save(d, account.id)}
                />
              </li>
            ) : (
              <li
                key={account.id}
                className={`card p-4 ${account.isHidden ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-neutral-900">{account.provider}</span>
                      <span className="badge-neutral">
                        {TYPE_LABEL[account.valueType]}
                      </span>
                      {account.isHidden && (
                        <span className="badge-warn">مخفي</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-neutral-500">{account.beneficiary}</p>
                    <p className="ltr-nums mt-2 break-all font-mono text-sm text-neutral-700">
                      {account.valueType === "IBAN"
                        ? formatIban(account.value)
                        : account.value}
                    </p>
                  </div>

                  {/* أزرار الترتيب */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label="تحريك لأعلى"
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === accounts.length - 1}
                      aria-label="تحريك لأسفل"
                      className="rounded-lg border border-neutral-200 px-2 py-1 text-neutral-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditing(account.id)}
                    className="btn-ghost btn-sm"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHidden(account)}
                    className="btn-ghost btn-sm"
                  >
                    {account.isHidden ? "إظهار" : "إخفاء"}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(account.id)}
                    className="btn-danger btn-sm"
                  >
                    حذف
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}

// ─────────────────────────── نموذج الحساب ───────────────────────────

function AccountForm({
  initial,
  busy,
  onSave,
  onCancel,
}: {
  initial: Omit<AccountDraft, "id">;
  busy: boolean;
  onSave: (draft: Omit<AccountDraft, "id">) => Promise<{ error?: string }>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await onSave(draft);
    if (res.error) setError(res.error);
  }

  const valueHint =
    draft.valueType === "IBAN"
      ? "مثال: SA0380000000608010167519"
      : draft.valueType === "ACCOUNT_NUMBER"
        ? "أرقام فقط، 6 خانات فأكثر"
        : "مثال: 0512345678";

  return (
    <form onSubmit={submit} className="card space-y-4 border-brand-200 p-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="kind">
            النوع
          </label>
          <select
            id="kind"
            value={draft.kind}
            onChange={(e) => {
              const kind = e.target.value as "BANK" | "WALLET";
              set("kind", kind);
              // نبدّل نوع البيانات تلقائيًا ليطابق النوع المختار
              set("valueType", kind === "WALLET" ? "WALLET_NUMBER" : "IBAN");
            }}
            className="input"
          >
            <option value="BANK">بنك</option>
            <option value="WALLET">محفظة</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="provider">
            {draft.kind === "BANK" ? "اسم البنك" : "اسم المحفظة"}
          </label>
          <input
            id="provider"
            required
            maxLength={60}
            value={draft.provider}
            onChange={(e) => set("provider", e.target.value)}
            className="input"
            placeholder={draft.kind === "BANK" ? "مصرف الراجحي" : "STC Pay"}
          />
        </div>

        <div>
          <label className="label" htmlFor="beneficiary">
            اسم المستفيد
          </label>
          <input
            id="beneficiary"
            required
            maxLength={80}
            value={draft.beneficiary}
            onChange={(e) => set("beneficiary", e.target.value)}
            className="input"
            placeholder="كما هو مسجّل في البنك"
          />
        </div>

        <div>
          <label className="label" htmlFor="valueType">
            نوع البيانات
          </label>
          <select
            id="valueType"
            value={draft.valueType}
            onChange={(e) => set("valueType", e.target.value as AccountDraft["valueType"])}
            className="input"
          >
            <option value="IBAN">آيبان</option>
            <option value="ACCOUNT_NUMBER">رقم حساب</option>
            <option value="WALLET_NUMBER">رقم محفظة</option>
          </select>
        </div>
      </div>

      <div>
        <label className="label" htmlFor="value">
          البيانات
        </label>
        <input
          id="value"
          required
          dir="ltr"
          maxLength={64}
          value={draft.value}
          onChange={(e) => set("value", e.target.value)}
          className="input ltr-nums font-mono"
          placeholder={valueHint}
          aria-describedby="value-hint"
        />
        <p id="value-hint" className="hint">
          {valueHint}
        </p>
      </div>

      <div>
        <label className="label" htmlFor="note">
          ملاحظة (اختياري)
        </label>
        <input
          id="note"
          maxLength={100}
          value={draft.note ?? ""}
          onChange={(e) => set("note", e.target.value)}
          className="input"
          placeholder="مثال: للحوالات الداخلية فقط"
        />
      </div>

      <label className="flex items-center gap-2.5 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={draft.isHidden}
          onChange={(e) => set("isHidden", e.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500"
        />
        إخفاء من الصفحة العامة
      </label>

      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {busy ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost">
          إلغاء
        </button>
      </div>
    </form>
  );
}
