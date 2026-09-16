import { db } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

/**
 * تقديم الصور من قاعدة البيانات.
 *
 * الصور عامة بطبيعتها (تظهر في الصفحة العامة) فلا تحتاج مصادقة، لكن:
 * - نثبّت Content-Type على القيمة المخزّنة (وهي دائمًا webp بعد إعادة الترميز)
 * - nosniff يمنع المتصفح من تخمين نوع مختلف
 * - CSP `sandbox` يعطّل أي تنفيذ لو تسلّل محتوى غير متوقّع
 */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;

  const media = await db.media.findUnique({
    where: { id },
    select: { data: true, mimeType: true, size: true },
  });

  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(media.data), {
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.size),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
