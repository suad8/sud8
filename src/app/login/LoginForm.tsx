"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Step = "email" | "code";

export function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.fields?.email ?? data.message ?? "تعذّر إرسال الرمز");
        return;
      }

      setStep("code");
      setNotice(data.message);
      setDevCode(data.devCode ?? null);
      setCooldown(30);
    } catch {
      setError("تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجددًا.");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "الرمز غير صحيح");
        setCode("");
        codeRef.current?.focus();
        return;
      }

      router.push(data.next ?? "/dashboard");
      router.refresh();
    } catch {
      setError("تعذّر الاتصال بالخادم. حاول مجددًا.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={requestCode} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">
            البريد الإلكتروني
          </label>
          <input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input text-left"
            placeholder="you@example.com"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "login-error" : undefined}
          />
        </div>

        {error && (
          <p id="login-error" role="alert" className="error-text">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading || !email} className="btn-primary w-full">
          {loading ? <Spinner /> : "أرسل رمز التحقق"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={verify} className="mt-6 space-y-4" noValidate>
      {notice && (
        <div className="note-info" role="status">
          {notice}
        </div>
      )}

      {devCode && (
        <div className="note-warn">
          <strong>وضع التطوير:</strong> الرمز هو{" "}
          <span className="ltr-nums font-mono font-bold">{devCode}</span>
          <p className="mt-1 text-xs">
            يظهر هنا لأن SMTP غير مضبوط. في الإنتاج يصل بالبريد فقط.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="code" className="label">
          رمز التحقق
        </label>
        <input
          ref={codeRef}
          id="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="input ltr-nums text-center font-mono text-2xl tracking-[0.4em]"
          placeholder="······"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "code-error" : undefined}
        />
        <p className="hint">
          أرسلناه إلى <span dir="ltr">{email}</span> — صالح 10 دقائق.
        </p>
      </div>

      {error && (
        <p id="code-error" role="alert" className="error-text">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="btn-primary w-full"
      >
        {loading ? <Spinner /> : "تأكيد ودخول"}
      </button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setStep("email");
            setCode("");
            setError(null);
            setDevCode(null);
          }}
          className="font-medium text-neutral-600 hover:text-neutral-900"
        >
          تغيير البريد
        </button>

        <button
          type="button"
          onClick={() => requestCode()}
          disabled={cooldown > 0 || loading}
          className="font-medium text-brand-700 disabled:text-neutral-400"
        >
          {cooldown > 0 ? `إعادة الإرسال بعد ${cooldown}s` : "إعادة إرسال الرمز"}
        </button>
      </div>
    </form>
  );
}

function Spinner() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-label="جارٍ التحميل"
    />
  );
}
