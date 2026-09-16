import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { Wordmark } from "@/components/Brand";
import { AdminTable } from "./AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // حارس على مستوى الصفحة إضافةً إلى الحارس في مسار الـ API
  if (user.role !== "ADMIN") redirect("/dashboard");

  const [users, stats] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        status: true,
        createdAt: true,
        page: {
          select: {
            username: true,
            isBlocked: true,
            blockReason: true,
            isPublished: true,
            viewCount: true,
            _count: { select: { accounts: true } },
          },
        },
      },
    }),
    Promise.all([
      db.user.count(),
      db.page.count(),
      db.user.count({ where: { plan: "PRO" } }),
      db.subscription.count({ where: { status: "PENDING" } }),
    ]),
  ]);

  const [totalUsers, totalPages, proUsers, pendingSubs] = stats;

  return (
    <div className="min-h-dvh bg-neutral-50">
      <header className="border-b border-neutral-100 bg-white">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Wordmark />
            <span className="badge-warn">الإدارة</span>
          </div>
          <Link href="/dashboard" className="btn-ghost">
            لوحتي
          </Link>
        </div>
      </header>

      <main className="container-app space-y-5 py-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "المستخدمون", value: totalUsers },
            { label: "الصفحات", value: totalPages },
            { label: "مشتركو PRO", value: proUsers },
            { label: "طلبات معلّقة", value: pendingSubs },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className="ltr-nums mt-1 text-2xl font-bold text-neutral-900">{s.value}</p>
            </div>
          ))}
        </div>

        <AdminTable
          users={users.map((u) => ({
            id: u.id,
            email: u.email,
            role: u.role,
            plan: u.plan,
            status: u.status,
            createdAt: u.createdAt.toISOString().slice(0, 10),
            username: u.page?.username ?? null,
            isBlocked: u.page?.isBlocked ?? false,
            blockReason: u.page?.blockReason ?? null,
            accountCount: u.page?._count.accounts ?? 0,
            viewCount: u.page?.viewCount ?? 0,
          }))}
        />
      </main>
    </div>
  );
}
