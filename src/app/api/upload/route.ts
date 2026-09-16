import { NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { assertSameOrigin, fail, ok, requireUser, tooMany } from "@/lib/api";
import { LIMITS } from "@/lib/ratelimit";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB قبل المعالجة
const OUTPUT_SIZE = 400; // مربّع 400×400

/** التواقيع الثنائية للأنواع المسموحة — لا نثق بـ Content-Type من العميل */
const MAGIC: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
];

function sniff(buf: Buffer): string | null {
  for (const sig of MAGIC) {
    if (sig.bytes.every((b, i) => buf[i] === b)) return sig.mime;
  }
  return null;
}

export async function POST(req: Request) {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const limit = LIMITS.uploadPerUser(user.id);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_UPLOAD_BYTES) {
    return fail("الصورة أكبر من 4 ميجابايت", 413);
  }

  const form = await req.formData().catch(() => null);
  if (!form) return fail("طلب غير صالح");

  const file = form.get("file");
  if (!(file instanceof File)) return fail("لم نستلم أي ملف");
  if (file.size > MAX_UPLOAD_BYTES) return fail("الصورة أكبر من 4 ميجابايت", 413);

  const input = Buffer.from(await file.arrayBuffer());

  // 1) فحص التوقيع الثنائي
  const sniffed = sniff(input);
  if (!sniffed) return fail("نوع الصورة غير مدعوم (المسموح: JPG أو PNG أو WebP)");

  // 2) إعادة الترميز عبر sharp.
  //    هذا يُسقط بيانات EXIF وأي محتوى مُضمَّن (سكربت في SVG، حمولة في
  //    مقطع JPEG) لأن الناتج يُبنى من البكسلات فقط.
  let output: Buffer;
  let meta: { width: number; height: number };
  try {
    const pipeline = sharp(input, { limitInputPixels: 50_000_000, animated: false })
      .rotate() // يطبّق دوران EXIF ثم يتخلّص منه
      .resize(OUTPUT_SIZE, OUTPUT_SIZE, { fit: "cover", position: "centre" })
      .webp({ quality: 82 });

    output = await pipeline.toBuffer();
    const info = await sharp(output).metadata();
    meta = { width: info.width ?? OUTPUT_SIZE, height: info.height ?? OUTPUT_SIZE };
  } catch {
    return fail("تعذّر قراءة الصورة — تأكد أنها ملف صورة صالح");
  }

  // نحذف الصورة القديمة حتى لا تتراكم
  const page = await db.page.findUnique({
    where: { userId: user.id },
    select: { avatarId: true },
  });

  const media = await db.media.create({
    data: {
      userId: user.id,
      mimeType: "image/webp",
      size: output.byteLength,
      width: meta.width,
      height: meta.height,
      // نسخة Uint8Array مدعومة بـ ArrayBuffer — نوع Bytes الذي يتوقّعه Prisma
      data: new Uint8Array(output),
    },
    select: { id: true },
  });

  if (page) {
    await db.page.update({ where: { userId: user.id }, data: { avatarId: media.id } });
  }

  if (page?.avatarId) {
    await db.media.deleteMany({ where: { id: page.avatarId, userId: user.id } }).catch(() => {});
  }

  return ok({ mediaId: media.id, url: `/api/media/${media.id}` }, 201);
}
