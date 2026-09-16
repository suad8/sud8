import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { LoginForm } from "./LoginForm";
import { getCurrentUser } from "@/lib/session";
import { passwordLoginEnabled } from "@/lib/env";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="border-b border-neutral-100 bg-white">
        <div className="container-app flex h-16 items-center">
          <Link href="/">
            <Wordmark />
          </Link>
        </div>
      </header>

      <main className="container-app flex flex-1 items-center justify-center py-10">
        <div className="w-full max-w-sm">
          <div className="card p-6">
            <h1 className="text-xl font-bold text-neutral-900">الدخول إلى حوّل</h1>
            <p className="mt-1.5 text-sm text-neutral-600">
              أدخل بريدك ونرسل لك رمز تحقق. لا حاجة لكلمة مرور.
            </p>
            <LoginForm passwordLogin={passwordLoginEnabled} />
          </div>

          <p className="mt-4 text-center text-xs leading-relaxed text-neutral-500">
            بالمتابعة أنت توافق على أن تكون البيانات التي تنشرها صحيحة وتخصّك.
          </p>
        </div>
      </main>
    </div>
  );
}
