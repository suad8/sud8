import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { Wordmark } from "@/components/Brand";
import { LogoutButton } from "@/components/LogoutButton";
import { PLANS } from "@/lib/plans";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="sticky top-0 z-20 border-b border-neutral-100 bg-white">
        <div className="container-app flex h-16 items-center justify-between gap-3">
          <Link href="/dashboard">
            <Wordmark />
          </Link>

          <div className="flex items-center gap-2">
            <span className={user.plan === "PRO" ? "badge-solid" : "badge-neutral"}>
              {PLANS[user.plan].name}
            </span>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="badge-warn">
                الإدارة
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>

        <nav className="container-app flex gap-1 overflow-x-auto pb-2 text-sm">
          {[
            { href: "/dashboard", label: "الحسابات" },
            { href: "/dashboard/settings", label: "إعداد الصفحة" },
            { href: "/dashboard/share", label: "المشاركة" },
            { href: "/dashboard/billing", label: "الاشتراك" },
            { href: "/dashboard/privacy", label: "بياناتي" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 rounded-lg px-3 py-1.5 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="container-app py-6">{children}</main>
    </div>
  );
}
