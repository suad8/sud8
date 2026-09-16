"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  displayName: string;
  bio: string;
  username: string;
  theme: string;
  accentColor: string;
  hideBranding: boolean;
  isPublished: boolean;
  customCss: string;
  avatarId: string | null;
};

type ThemeOption = { id: string; name: string; locked: boolean };

export function PageSettingsForm({
  initial,
  themes,
  canCustomColors,
  canRemoveBranding,
  canCustomCss,
}: {
  initial: Initial;
  themes: ThemeOption[];
  canCustomColors: boolean;
  canRemoveBranding: boolean;
  canCustomCss: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [avatarId, setAvatarId] = useState(initial.avatarId);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flash, setFlash] = useState<string | null>(null);

  function set<K extends keyof Initial>(key: K, val: Initial[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function upload(file: File) {
    setUploading(true);
    setErrors({});
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        setErrors({ avatar: data.message ?? "تعذّر رفع الصورة" });
        return;
      }
      setAvatarId(data.mediaId);
      setFlash("رُفعت الصورة");
      router.refresh();
    } catch {
      setErrors({ avatar: "تعذّر الاتصال بالخادم" });
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFlash(null);

    try {
      const res = await fetch("/api/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fields ?? { _: data.message ?? "تعذّر الحفظ" });
        return;
      }

      setFlash("حُفظت التغييرات");
      router.refresh();
    } catch {
      setErrors({ _: "تعذّر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {/* ─── الصورة ─── */}
      <section className="card p-5">
        <h2 className="font-bold text-neutral-900">الصورة أو الشعار</h2>
        <div className="mt-4 flex items-center gap-4">
          {avatarId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${avatarId}`}
              alt="الصورة الحالية"
              className="h-20 w-20 rounded-full object-cover"
              width={80}
              height={80}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-2xl font-bold text-neutral-400">
              {form.displayName.trim().charAt(0) || "؟"}
            </div>
          )}

          <div className="flex-1">
            <label className="btn-ghost cursor-pointer">
              {uploading ? "جارٍ الرفع…" : "اختر صورة"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = "";
                }}
              />
            </label>
            <p className="hint">JPG أو PNG أو WebP — حتى 4 ميجابايت.</p>
            {errors.avatar && <p className="error-text">{errors.avatar}</p>}
          </div>
        </div>
      </section>

      {/* ─── الهوية ─── */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-neutral-900">بيانات الصفحة</h2>

        <div>
          <label className="label" htmlFor="displayName">
            الاسم أو اسم النشاط
          </label>
          <input
            id="displayName"
            required
            maxLength={60}
            value={form.displayName}
            onChange={(e) => set("displayName", e.target.value)}
            className="input"
          />
          {errors.displayName && <p className="error-text">{errors.displayName}</p>}
        </div>

        <div>
          <label className="label" htmlFor="bio">
            وصف قصير (اختياري)
          </label>
          <input
            id="bio"
            maxLength={160}
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            className="input"
            placeholder="مثال: للطلبات والحجوزات"
          />
          <p className="hint">{form.bio.length}/160</p>
          {errors.bio && <p className="error-text">{errors.bio}</p>}
        </div>

        <div>
          <label className="label" htmlFor="username">
            اسم المستخدم (الرابط)
          </label>
          <div className="flex items-center gap-2" dir="ltr">
            <span className="shrink-0 font-mono text-sm text-neutral-500">/u/</span>
            <input
              id="username"
              required
              dir="ltr"
              maxLength={30}
              value={form.username}
              onChange={(e) =>
                set("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
              }
              className="input ltr-nums font-mono"
            />
          </div>
          <p className="hint">حروف إنجليزية صغيرة وأرقام وشرطة سفلية. الرابط ثابت بعد النشر.</p>
          {errors.username && <p className="error-text">{errors.username}</p>}
        </div>
      </section>

      {/* ─── المظهر ─── */}
      <section className="card space-y-4 p-5">
        <h2 className="font-bold text-neutral-900">المظهر</h2>

        <div>
          <span className="label">الثيم</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {themes.map((t) => {
              const selected = form.theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={t.locked}
                  onClick={() => set("theme", t.id)}
                  aria-pressed={selected}
                  className={`theme-${t.id} relative overflow-hidden rounded-lg border-2 p-3 text-start transition
                    ${selected ? "border-brand-600" : "border-neutral-200 hover:border-neutral-300"}
                    ${t.locked ? "cursor-not-allowed" : ""}`}
                  // الثيم المقفل يبقى بألوانه الحقيقية — التعتيم كان يجعل
                  // كل الثيمات تبدو رمادية متطابقة فلا تُرى الفروق
                  style={{ background: "var(--surface)", color: "var(--fg)" }}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ background: "var(--accent)" }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-semibold">{t.name}</span>
                  </span>

                  <span
                    className="mt-2 block h-1.5 w-full rounded-full"
                    style={{ background: "var(--line)" }}
                    aria-hidden="true"
                  />

                  {t.locked && (
                    <span className="badge-neutral absolute left-1.5 top-1.5">PRO</span>
                  )}
                </button>
              );
            })}
          </div>
          {errors.theme && <p className="error-text">{errors.theme}</p>}
        </div>

        <div>
          <label className="label" htmlFor="accentColor">
            لون مخصص {!canCustomColors && <span className="text-neutral-400">(PRO)</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              id="accentColor"
              type="color"
              disabled={!canCustomColors}
              value={form.accentColor || "#2b4cd4"}
              onChange={(e) => set("accentColor", e.target.value)}
              className="h-11 w-16 cursor-pointer rounded-lg border border-neutral-200 disabled:opacity-40"
            />
            {form.accentColor && canCustomColors && (
              <button
                type="button"
                onClick={() => set("accentColor", "")}
                className="text-sm font-medium text-neutral-500 hover:text-neutral-900"
              >
                إزالة اللون المخصص
              </button>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            disabled={!canRemoveBranding}
            checked={form.hideBranding}
            onChange={(e) => set("hideBranding", e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600 disabled:opacity-40"
          />
          إخفاء علامة «حوّل» من صفحتي
          {!canRemoveBranding && <span className="badge-neutral">PRO</span>}
        </label>

        <label className="flex items-center gap-2.5 text-sm text-neutral-700">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => set("isPublished", e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-brand-600"
          />
          نشر الصفحة (إلغاء التحديد يخفيها عن الزوار)
        </label>
      </section>

      {canCustomCss && (
        <section className="card space-y-3 p-5">
          <div>
            <h2 className="font-bold text-neutral-900">CSS مخصص</h2>
            <p className="hint">
              تحكّم كامل بتصميم صفحتك العامة. جرّب{" "}
              <code className="font-mono text-xs">.themed-card</code> للبطاقات و
              <code className="font-mono text-xs">.btn-copy</code> لزر النسخ.
            </p>
          </div>

          <textarea
            id="customCss"
            dir="ltr"
            rows={9}
            spellCheck={false}
            maxLength={8000}
            value={form.customCss}
            onChange={(e) => set("customCss", e.target.value)}
            className="input h-auto py-3 font-mono text-xs leading-relaxed"
            placeholder={".themed-card { border-radius: 24px; }\n.btn-copy { letter-spacing: .02em; }"}
          />
          <p className="hint">{form.customCss.length}/8000</p>

          <div className="note-warn">
            <strong>لأمان زوّارك:</strong> تُزال الروابط الخارجية و
            <code className="font-mono text-xs">@import</code> و
            <code className="font-mono text-xs">position:fixed</code>، ويبقى
            تنبيه التحقق وعلامة «حوّل» ظاهرين دائمًا.
          </div>

          {errors.customCss && <p className="error-text">{errors.customCss}</p>}
        </section>
      )}

      {errors._ && (
        <p role="alert" className="error-text">
          {errors._}
        </p>
      )}
      {flash && (
        <p role="status" className="rounded-xl bg-brand-50 p-3 text-sm font-medium text-brand-800">
          {flash}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full sm:w-auto">
        {busy ? "جارٍ الحفظ…" : "حفظ التغييرات"}
      </button>
    </form>
  );
}
