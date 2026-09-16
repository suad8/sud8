import { PrismaClient } from "@prisma/client";
import { isProd } from "./env";

/**
 * نسخة واحدة من Prisma عبر إعادة تحميل الوحدات في التطوير،
 * وإلا استنزفت اتصالات قاعدة البيانات مع كل hot reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * عنوان احتياطي حين ينقص DATABASE_URL.
 *
 * بناء PrismaClient بلا عنوان يرمي عند تحميل الوحدة، فيُسقط كل صفحة
 * تستورده — بما فيها صفحة الإعداد التي يُفترض أن تشرح المشكلة. بهذا
 * العنوان يُبنى العميل بنجاح وتفشل الاستعلامات وحدها، وصفحة الإعداد
 * تظهر وتشرح السبب.
 */
const url = process.env.DATABASE_URL || "postgresql://unset:unset@127.0.0.1:5432/unset";

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url } },
    log: isProd ? ["error"] : ["error", "warn"],
  });

if (!isProd) globalForPrisma.prisma = db;
