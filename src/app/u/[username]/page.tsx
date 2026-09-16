import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatIban } from "@/lib/iban";
import { usernameSchema } from "@/lib/validation";
import { normalizeTheme } from "@/lib/plans";
import { protectionCss, sanitizeCss } from "@/lib/css";
import { CopyButton } from "@/components/CopyButton";
import { Glyph } from "@/components/Brand";
import { ShareBar } from "./ShareBar";

type Props = { params: Promise<{ username: string }> };

/** الصفحة العامة ديناميكية — تعديل الحسابات ينعكس فورًا بلا تغيير الرابط */
export const dynamic = "force-dynamic";

async function loadPage(rawUsername: string) {
  const parsed = usernameSchema.safeParse(decodeURIComponent(rawUsername));
  if (!parsed.success) return null;

  const page = await db.page.findUnique({
    where: { username: parsed.data },
    include: {
      accounts: { where: { isHidden: false }, orderBy: { sortOrder: "asc" } },
      user: { select: { status: true } },
    },
  });

  if (!page) return null;
  if (page.isBlocked || !page.isPublished || page.user.status === "SUSPENDED") return null;

  return page;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const page = await loadPage(username);

  if (!page) return { title: "الصفحة غير موجودة", robots: { index: false } };

  return {
    title: page.displayName,
    description: page.bio ?? `حسابات ${page.displayName} في صفحة واحدة`,
    openGraph: {
      title: page.displayName,
      description: page.bio ?? undefined,
      type: "profile",
    },
  };
}

const TYPE_LABEL = {
  IBAN: "آيبان",
  ACCOUNT_NUMBER: "رقم حساب",
  WALLET_NUMBER: "رقم محفظة",
} as const;

export default async function PublicPage({ params }: Props) {
  const { username } = await params;
  const page = await loadPage(username);

  if (!page) notFound();

  db.page
    .update({ where: { id: page.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const initial = page.displayName.trim().charAt(0) || "؟";

  // تعقيم ثانٍ عند العرض: البيانات المخزّنة معقّمة أصلًا، لكن تشديد
  // القواعد لاحقًا يجب أن يسري على ما حُفظ قبله
  const userCss = page.customCss ? sanitizeCss(page.customCss).css : "";

  return (
    <div
      // normalizeTheme يحمي من معرّف ثيم قديم أو غير معروف — بدونه تُعرض
      // الصفحة بلا رموز لون إطلاقًا
      className={`theme-${normalizeTheme(page.theme)} themed-page min-h-dvh pb-14`}
      // اللون المخصص يتجاوز رمز الثيم وحده — بقية الرموز تبقى متناسقة
      style={page.accentColor ? { ["--accent" as string]: page.accentColor } : undefined}
    >
      {userCss ? (
        <style
          // المحتوى معقّم: لا < ولا > ولا @import ولا روابط خارجية.
          // قواعد الحماية تأتي بعده فلا يستطيع إخفاء التنبيه أو العلامة.
          dangerouslySetInnerHTML={{ __html: userCss + protectionCss() }}
        />
      ) : null}

      <div className="mx-auto w-full max-w-md px-4 pt-12">
        {/* ── الهوية ── */}
        <header className="flex flex-col items-center text-center">
          {page.avatarId ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/media/${page.avatarId}`}
              alt=""
              width={84}
              height={84}
              className="h-21 w-21 rounded-full object-cover"
              style={{ height: 84, width: 84, border: "3px solid var(--card)" }}
            />
          ) : (
            <div
              className="flex items-center justify-center rounded-full text-3xl font-bold"
              style={{
                height: 84,
                width: 84,
                background: "var(--accent)",
                color: "var(--accent-fg)",
              }}
              aria-hidden="true"
            >
              {initial}
            </div>
          )}

          <h1 className="mt-4 text-xl font-bold tracking-tight">{page.displayName}</h1>

          {page.bio && (
            <p className="themed-muted mt-1 max-w-xs text-sm">{page.bio}</p>
          )}
        </header>

        <ShareBar username={page.username} displayName={page.displayName} />

        {/* ── الحسابات ── */}
        <main className="mt-4 space-y-3">
          {page.accounts.length === 0 ? (
            <div className="themed-card py-10 text-center">
              <p className="themed-muted text-sm">لم يُضف صاحب الصفحة أي حساب بعد.</p>
            </div>
          ) : (
            page.accounts.map((account) => {
              const display =
                account.valueType === "IBAN" ? formatIban(account.value) : account.value;

              return (
                <article key={account.id} className="themed-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate font-bold">{account.provider}</h2>
                      <p className="themed-muted mt-0.5 truncate text-xs">
                        {account.beneficiary}
                      </p>
                    </div>
                    <span
                      className="badge shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--accent) 12%, transparent)",
                        color: "var(--accent)",
                      }}
                    >
                      {TYPE_LABEL[account.valueType]}
                    </span>
                  </div>

                  <p className="datum mt-3 select-all break-all">{display}</p>

                  {account.note && (
                    <p className="themed-muted mt-2 text-xs">{account.note}</p>
                  )}

                  {/* ننسخ القيمة الخام بلا مسافات — أسهل للّصق في تطبيق البنك */}
                  <div className="mt-3">
                    <CopyButton value={account.value} label="نسخ الرقم" />
                  </div>
                </article>
              );
            })
          )}
        </main>

        <p
          className="hawwil-notice themed-muted mt-6 rounded-lg px-4 py-3 text-center text-xs leading-relaxed"
          style={{ background: "color-mix(in srgb, var(--fg) 4%, transparent)" }}
        >
          هذه البيانات أدخلها صاحب الصفحة. «حوّل» لا تتحقق من ملكية الحسابات —
          تأكّد من صاحبها قبل أي تحويل.
        </p>

        {!page.hideBranding && (
          <footer className="hawwil-brand mt-8 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition hover:opacity-80"
              style={{ background: "var(--card)", color: "var(--fg-muted)" }}
            >
              <Glyph size={15} />
              أنشئ صفحتك على حوّل
            </Link>
          </footer>
        )}
      </div>
    </div>
  );
}
