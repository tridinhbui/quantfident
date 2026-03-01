import { NextResponse } from 'next/server';
import { apiLogger, trackMetric } from '@/lib/observability/logger';
import { prisma } from '@/lib/db/prisma';
import { getSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: boolean;
    supabase: boolean;
    firebase: boolean;
  };
  errors?: string[];
}

/**
 * GET /api/health
 * Health check endpoint for monitoring
 *
 * Used by:
 * - Vercel for liveness/readiness probes
 * - Uptime monitoring services
 * - Load balancers
 * - CI/CD deployment verification
 *
 * Response:
 * - 200: Service is healthy or degraded
 * - 503: Service is unhealthy
 */
export async function GET(): Promise<NextResponse<HealthCheckResult>> {
  const startTime = Date.now();
  const errors: string[] = [];
  const checks = {
    database: false,
    supabase: false,
    firebase: false,
  };

  // Check Prisma connection
  try {
    if (prisma) {
      // Quick query to verify database connection
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } else {
      errors.push('Database client not initialized');
    }
  } catch (error) {
    apiLogger.error('Database health check failed', error);
    errors.push(`Database: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check Supabase connection
  try {
    const supabaseServer = getSupabaseServer();
    // Lightweight query to verify connection
    const { error: supabaseError } = await supabaseServer.from('profiles').select('id').limit(1);
    if (!supabaseError) {
      checks.supabase = true;
    } else {
      errors.push(`Supabase: ${supabaseError.message}`);
    }
  } catch (error) {
    apiLogger.error('Supabase health check failed', error);
    errors.push(`Supabase: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Check Firebase configuration (no actual connectivity check needed)
  // We just verify that required env vars are present
  try {
    const firebaseKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (firebaseKey && projectId) {
      checks.firebase = true;
    } else {
      errors.push('Firebase: Missing required environment variables');
    }
  } catch {
    errors.push(`Firebase: Configuration check failed`);
  }

  const durationMs = Date.now() - startTime;
  const allChecksPassed = Object.values(checks).every((v) => v);
  const status = allChecksPassed ? 'healthy' : errors.length > 0 ? 'degraded' : 'unhealthy';
  const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

  // Track health check
  trackMetric({
    name: 'health_check',
    value: durationMs,
    unit: 'ms',
    tags: {
      status,
    },
  });

  // Log if unhealthy
  if (status !== 'healthy') {
    apiLogger.warn('Health check degraded or unhealthy', {
      status,
      checks,
      errors,
      durationMs,
    });
  }

  const result: HealthCheckResult = {
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks,
    ...(errors.length > 0 && { errors }),
  };

  return NextResponse.json(result, { status: statusCode });
}
