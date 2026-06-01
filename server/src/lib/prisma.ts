// Created: 2026-05-30 10:50
import { PrismaClient } from '@prisma/client';

// tsx watch 재기동 시 커넥션 누수를 막기 위한 싱글톤
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
