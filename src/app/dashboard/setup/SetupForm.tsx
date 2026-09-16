"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// defaultTheme يصل كـ prop من الخادم: استيراد @/lib/plans هنا يسحب معه
// التحقق من متغيرات البيئة، وهو يرمي خطأ في المتصفح فيمنع النموذج كله
export function SetupForm({
  suggestedUsername,
  defaultTheme,
}: {
  suggestedUsername: string;
  defaultTheme: string;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState(suggestedUsername);
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErrors({});

    try {
      const res = await fetch("/api/page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          username,
          bio,
          theme: defaultTheme,
          accentColor: "",
          hideBranding: false,
          isPublished: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrors(data.fields ?? { _: data.message ?? "تعذّر الإنشاء" });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setErrors({ _: "تعذّر الاتصال بالخادم" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-5" noValidate>
      <div>
        <label className="label" htmlFor="displayName">
          الاسم أو اسم النشاط
        </label>
        <input
          id="displayName"
          required
          autoFocus
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="input"
          placeholder="مثال: مقهى الرصيف"
        />
        {errors.displayName && <p className="error-text">{errors.displayName}</p>}
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
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="input ltr-nums font-mono"
            placeholder="my_shop"
          />
        </div>
        <p className="hint">3 أحرف فأكثر — حروف إنجليزية صغيرة وأرقام وشرطة سفلية.</p>
        {errors.username && <p className="error-text">{errors.username}</p>}
      </div>

      <div>
        <label className="label" htmlFor="bio">
          وصف قصير (اختياري)
        </label>
        <input
          id="bio"
          maxLength={160}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="input"
          placeholder="للطلبات والحجوزات"
        />
        {errors.bio && <p className="error-text">{errors.bio}</p>}
      </div>

      {errors._ && (
        <p role="alert" className="error-text">
          {errors._}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !displayName || username.length < 3}
        className="btn-primary w-full"
      >
        {busy ? "جارٍ الإنشاء…" : "إنشاء الصفحة"}
      </button>
    </form>
  );
}
