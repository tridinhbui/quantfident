// Session management service using Prisma + Postgres
import { prisma } from '@/lib/db/prisma';
import type { Prisma } from '@prisma/client';

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

export interface CreateSessionInput {
  userId: string;
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionContextData {
  [key: string]: unknown;
}

export class SessionService {
  /**
   * Create a new user session
   */
  static async createSession(input: CreateSessionInput) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const session = await prisma.userSession.create({
      data: {
        userId: input.userId,
        sessionId,
        deviceName: input.deviceName,
        deviceType: input.deviceType,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        expiresAt,
      },
    });

    return session;
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserActiveSessions(userId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        context: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    return sessions;
  }

  /**
   * Get a specific session by sessionId
   */
  static async getSessionById(sessionId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const session = await prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        context: true,
      },
    });

    return session;
  }

  /**
   * Update session last activity and return updated session
   */
  static async updateSessionActivity(sessionId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const session = await prisma.userSession.update({
      where: { sessionId },
      data: {
        lastActivityAt: new Date(),
      },
      include: {
        context: true,
      },
    });

    return session;
  }

  /**
   * Deactivate a session (logout)
   */
  static async endSession(sessionId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const session = await prisma.userSession.update({
      where: { sessionId },
      data: {
        isActive: false,
      },
    });

    return session;
  }

  /**
   * End all sessions for a user (logout all devices)
   */
  static async endAllUserSessions(userId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    await prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  /**
   * Update session context data
   */
  static async updateSessionContext(
    sessionId: string,
    contextData: SessionContextData
  ) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const session = await prisma.userSession.findUnique({
      where: { sessionId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    let context = await prisma.sessionContext.findUnique({
      where: { sessionId },
    });

    if (!context) {
      context = await prisma.sessionContext.create({
        data: {
          userId: session.userId,
          sessionId,
          contextData: contextData as Prisma.InputJsonValue,
        },
      });
    } else {
      // Merge with existing context data
      const existingData = (context.contextData as SessionContextData) || {};
      const mergedData = { ...existingData, ...contextData };

      context = await prisma.sessionContext.update({
        where: { id: context.id },
        data: {
          contextData: mergedData as Prisma.InputJsonValue,
        },
      });
    }

    return context;
  }

  /**
   * Get session context
   */
  static async getSessionContext(sessionId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const context = await prisma.sessionContext.findUnique({
      where: { sessionId },
    });

    return context;
  }

  /**
   * Create a session snapshot for recovery/history
   */
  static async createSessionSnapshot(
    userId: string,
    sessionId: string | undefined,
    snapshotData: SessionContextData,
    snapshotName?: string
  ) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const snapshot = await prisma.sessionSnapshot.create({
      data: {
        userId,
        sessionId: sessionId || undefined,
        snapshotData: snapshotData as Prisma.InputJsonValue,
        snapshotName,
        isManual: !!snapshotName, // Manual if user provided a name
        source: snapshotName ? 'manual' : 'auto',
      },
    });

    return snapshot;
  }

  /**
   * Get session snapshots for a user (for recovery)
   */
  static async getUserSessionSnapshots(
    userId: string,
    limit: number = 10
  ) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const snapshots = await prisma.sessionSnapshot.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return snapshots;
  }

  /**
   * Restore a session from a snapshot
   */
  static async restoreFromSnapshot(snapshotId: string, userId: string) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const snapshot = await prisma.sessionSnapshot.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot || snapshot.userId !== userId) {
      throw new Error('Snapshot not found or unauthorized');
    }

    return {
      snapshotData: snapshot.snapshotData as SessionContextData,
      createdAt: snapshot.createdAt,
      snapshotName: snapshot.snapshotName,
    };
  }

  /**
   * Get or create session context with default values
   */
  static async getOrCreateSessionContext(
    sessionId: string,
    userId: string,
    defaultData: SessionContextData = {}
  ) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    let context = await prisma.sessionContext.findUnique({
      where: { sessionId },
    });

    if (!context) {
      context = await prisma.sessionContext.create({
        data: {
          userId,
          sessionId,
          contextData: defaultData as Prisma.InputJsonValue,
        },
      });
    }

    return context;
  }

  /**
   * Clean up expired sessions and snapshots
   */
  static async cleanupExpiredData() {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const now = new Date();

    await prisma.userSession.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    await prisma.sessionSnapshot.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
  }

  /**
   * Share session context between sessions (cross-session state)
   */
  static async shareContextAcrossSessions(
    userId: string,
    contextKey: string,
    contextValue: unknown
  ) {
    if (!prisma) {
      throw new Error('Database not available');
    }

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        context: true,
      },
    });

    const sharedContextData = {
      [contextKey]: contextValue,
      sharedAt: new Date().toISOString(),
    };

    await Promise.all(
      sessions.map(session =>
        this.updateSessionContext(session.sessionId, sharedContextData)
      )
    );

    return sessions;
  }
}
