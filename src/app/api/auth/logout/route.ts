import { assertSameOrigin, ok } from "@/lib/api";
import { destroySession } from "@/lib/session";

export async function POST() {
  const originCheck = await assertSameOrigin();
  if (originCheck !== true) return originCheck;

  await destroySession();
  return ok({ next: "/" });
}
