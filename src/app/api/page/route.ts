import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { pageSettingsSchema, fieldErrors } from "@/lib/validation";
import { assertSameOrigin, fail, ok, readJson, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";
import { canUseTheme, planOf } from "@/lib/plans";
import { sanitizeCss } from "@/lib/css";

/** إنشاء أو تحديث صفحة المستخدم */
export async function PUT(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.writePerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const body = await readJson(req);
  if (!body) return fail("طلب غير صالح");

  const parsed = pageSettingsSchema.safeParse(body);
  if (!parsed.success) return fail("تحقق من البيانات", 400, fieldErrors(parsed.error));

  const data = parsed.data;
  const plan = planOf(user.plan);

  // فرض حدود الباقة على الخادم — لا نثق بما يرسله العميل
  if (!canUseTheme(user.plan, data.theme)) {
    return fail("هذا الثيم متاح في باقة PRO", 403, { theme: "متاح في PRO" });
  }
  const accentColor = plan.customColors && data.accentColor ? data.accentColor : null;

  // CSS للـ PRO فقط، ويُعقَّم قبل التخزين لا عند العرض فقط — فلا يُحفظ
  // في قاعدة البيانات شيء خطِر أصلًا
  let customCss: string | null = null;
  if (plan.customCss && data.customCss) {
    const { css } = sanitizeCss(data.customCss);
    customCss = css || null;
  }
  const hideBranding = plan.removeBranding ? (data.hideBranding ?? false) : false;

  try {
    const page = await db.page.upsert({
      where: { userId: user.id },
      update: {
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || null,
        theme: data.theme,
        accentColor,
        hideBranding,
        customCss,
        isPublished: data.isPublished ?? true,
      },
      create: {
        userId: user.id,
        username: data.username,
        displayName: data.displayName,
        bio: data.bio || null,
        theme: data.theme,
        accentColor,
        hideBranding,
        customCss,
        isPublished: data.isPublished ?? true,
      },
    });

    return ok({ page });
  } catch (e) {
    // P2002 = خرق قيد الفريد (اسم المستخدم محجوز)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return fail("اسم المستخدم محجوز", 409, { username: "هذا الاسم مستخدم بالفعل" });
    }
    throw e;
  }
}

/** فحص توفّر اسم المستخدم */
export async function GET(req: Request) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const username = new URL(req.url).searchParams.get("username");
  if (!username) return fail("اسم المستخدم مطلوب");

  const existing = await db.page.findUnique({
    where: { username: username.toLowerCase() },
    select: { userId: true },
  });

  return ok({ available: !existing || existing.userId === user.id });
}
