import QRCode from "qrcode";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { usernameSchema } from "@/lib/validation";

type Ctx = { params: Promise<{ username: string }> };

/**
 * رمز QR للصفحة العامة.
 * `?format=png` يعيد PNG للتنزيل، والافتراضي SVG (أوضح عند الطباعة).
 */
export async function GET(req: Request, { params }: Ctx) {
  const { username: raw } = await params;

  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) return new Response("Bad request", { status: 400 });
  const username = parsed.data;

  // لا نولّد رموزًا لصفحات غير موجودة أو محجوبة
  const page = await db.page.findUnique({
    where: { username },
    select: { isPublished: true, isBlocked: true },
  });
  if (!page || page.isBlocked || !page.isPublished) {
    return new Response("Not found", { status: 404 });
  }

  const url = `${env.APP_URL.replace(/\/$/, "")}/u/${username}`;
  const format = new URL(req.url).searchParams.get("format");

  const opts = {
    errorCorrectionLevel: "M" as const,
    margin: 2,
    width: 600,
    color: { dark: "#2b4cd4", light: "#ffffff" },
  };

  if (format === "png") {
    const png = await QRCode.toBuffer(url, { ...opts, type: "png" });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="hawwil-${username}.png"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  const svg = await QRCode.toString(url, { ...opts, type: "svg" });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
