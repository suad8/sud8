"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  plan: "FREE" | "PRO";
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  username: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  accountCount: number;
  viewCount: number;
};

type Action = "suspend" | "activate" | "block_page" | "unblock_page" | "set_plan";

export function AdminTable({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const filtered = users.filter(
    (u) =>
      u.email.includes(query.toLowerCase()) ||
      (u.username ?? "").includes(query.toLowerCase()),
  );

  async function act(userId: string, action: Action, plan?: "FREE" | "PRO") {
    let reason: string | undefined;

    if (action === "block_page") {
      const input = prompt("سبب الحجب (يظهر لصاحب الصفحة):");
      if (input === null) return;
      reason = input;
    }

    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action, reason, plan }),
      });
      const data = await res.json();

      if (!res.ok) {
        setFlash(data.message ?? "تعذّر تنفيذ الإجراء");
      } else {
        setFlash("نُفّذ الإجراء");
        router.refresh();
      }
    } catch {
      setFlash("تعذّر الاتصال بالخادم");
    } finally {
      setBusyId(null);
      setTimeout(() => setFlash(null), 3000);
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold text-neutral-900">المستخدمون</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالبريد أو الرابط…"
          className="input max-w-xs"
        />
      </div>

      {flash && (
        <p role="status" className="note-info">
          {flash}
        </p>
      )}

      <ul className="space-y-2">
        {filtered.map((u) => (
          <li key={u.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="ltr-nums truncate font-mono text-sm font-semibold text-neutral-900">
                  {u.email}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {u.role === "ADMIN" && (
                    <span className="badge-warn">مدير</span>
                  )}
                  <span
                    className={`badge ${u.plan === "PRO" ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-600"}`}
                  >
                    {u.plan}
                  </span>
                  {u.status === "SUSPENDED" && (
                    <span className="badge-danger">موقوف</span>
                  )}
                  {u.isBlocked && (
                    <span className="badge-danger">صفحة محجوبة</span>
                  )}
                  {u.username && (
                    <span className="badge-neutral ltr-nums font-mono">
                      /u/{u.username}
                    </span>
                  )}
                </div>
                <p className="ltr-nums mt-1.5 text-xs text-neutral-500">
                  {u.accountCount} حساب · {u.viewCount} مشاهدة · {u.createdAt}
                </p>
                {u.blockReason && (
                  <p className="mt-1 text-xs text-danger-600">السبب: {u.blockReason}</p>
                )}
              </div>
            </div>

            {u.role !== "ADMIN" && (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() =>
                    act(u.id, u.status === "ACTIVE" ? "suspend" : "activate")
                  }
                  className="btn-ghost btn-sm"
                >
                  {u.status === "ACTIVE" ? "إيقاف الحساب" : "تفعيل الحساب"}
                </button>

                {u.username && (
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() =>
                      act(u.id, u.isBlocked ? "unblock_page" : "block_page")
                    }
                    className="btn-ghost btn-sm"
                  >
                    {u.isBlocked ? "رفع الحجب" : "حجب الصفحة"}
                  </button>
                )}

                <button
                  type="button"
                  disabled={busyId === u.id}
                  onClick={() =>
                    act(u.id, "set_plan", u.plan === "PRO" ? "FREE" : "PRO")
                  }
                  className="btn-ghost btn-sm"
                >
                  {u.plan === "PRO" ? "إرجاع للمجانية" : "ترقية إلى PRO"}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="card p-8 text-center text-sm text-neutral-500">لا نتائج.</p>
      )}
    </section>
  );
}
