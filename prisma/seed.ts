/**
 * بيانات تجريبية للتطوير.
 * تشغيل:  npm run db:seed
 *
 * تنشئ حسابًا تجريبيًا بصفحة عامة جاهزة على /u/demo
 * لا تنشئ أي جلسة — للدخول استخدم صفحة /login بالبريد نفسه.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const email = "demo@example.com";

  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, plan: "FREE" },
  });

  const page = await db.page.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      username: "demo",
      displayName: "مقهى الرصيف",
      bio: "للطلبات والحجوزات",
      theme: "paper",
    },
  });

  const existing = await db.account.count({ where: { pageId: page.id } });
  if (existing === 0) {
    await db.account.createMany({
      data: [
        {
          pageId: page.id,
          kind: "BANK",
          provider: "مصرف الراجحي",
          beneficiary: "محمد بن سعد",
          valueType: "IBAN",
          // آيبان تجريبي صحيح البنية (خانة تحقق مطابقة)
          value: "SA0380000000608010167519",
          sortOrder: 0,
        },
        {
          pageId: page.id,
          kind: "WALLET",
          provider: "STC Pay",
          beneficiary: "محمد بن سعد",
          valueType: "WALLET_NUMBER",
          value: "+966512345678",
          note: "للمبالغ الصغيرة",
          sortOrder: 1,
        },
      ],
    });
  }

  console.log(`✅ حساب تجريبي: ${email}`);
  console.log(`✅ صفحة عامة:   /u/${page.username}`);
  console.log(`   ادخل من /login بالبريد أعلاه — الرمز يُطبع هنا في الطرفية.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
