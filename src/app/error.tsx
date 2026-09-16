"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // في الإنتاج أرسل هذا إلى خدمة تتبّع أخطاء بدل الطرفية
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <h1 className="text-xl font-bold text-neutral-900">حدث خطأ غير متوقع</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
        اعتذارنا — لم نتمكن من إتمام العملية. جرّب مرة أخرى.
      </p>

      {/* لا نعرض تفاصيل الخطأ للمستخدم، فقط المعرّف للدعم */}
      {error.digest && (
        <p className="ltr-nums mt-3 font-mono text-xs text-neutral-400">
          المعرّف: {error.digest}
        </p>
      )}

      <button type="button" onClick={reset} className="btn-primary mt-6">
        إعادة المحاولة
      </button>
    </div>
  );
}
