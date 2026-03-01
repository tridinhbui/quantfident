// Prisma client configuration
import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// Learn more:
// https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

// Initialize Prisma client safely - handle missing DATABASE_URL
function initializePrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL not configured. Database features will be unavailable.');
    return null;
  }

  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch (error) {
    console.error('Failed to initialize Prisma:', error);
    return null;
  }
}

if (!globalForPrisma.prisma && process.env.DATABASE_URL) {
  globalForPrisma.prisma = initializePrisma();
}

export const prisma = globalForPrisma.prisma ?? initializePrisma();

// Export a function to check if Prisma is available
export function isPrismaAvailable(): boolean {
  return prisma !== null && process.env.DATABASE_URL !== undefined;
}