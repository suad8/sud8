import Link from "next/link";
import { Logo } from "@/components/Brand";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 text-center">
      <Logo size={44} />
      <h1 className="mt-5 text-xl font-bold text-neutral-900">الصفحة غير موجودة</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
        الرابط الذي فتحته غير صحيح، أو أن صاحب الصفحة أوقف نشرها.
      </p>
      <Link href="/" className="btn-primary mt-6">
        الصفحة الرئيسية
      </Link>
    </div>
  );
}
