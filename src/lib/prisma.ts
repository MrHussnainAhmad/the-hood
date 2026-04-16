import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prismaLog: ("query" | "info" | "warn" | "error")[] =
  process.env.PRISMA_LOG_QUERIES === "true"
    ? ["query", "warn", "error"]
    : ["error"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: prismaLog,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
