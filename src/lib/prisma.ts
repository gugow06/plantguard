import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbUrl = new URL(process.env.DATABASE_URL!);
  // pg doesn't URL-decode %40 in connection strings, so pass explicit config
  const adapter = new PrismaPg({
    host: dbUrl.hostname,
    port: parseInt(dbUrl.port || '5432', 10),
    database: dbUrl.pathname.slice(1),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    ssl: { rejectUnauthorized: false },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
