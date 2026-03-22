/**
 * Audit log middleware.
 * Called explicitly from services/route handlers, not hooked globally —
 * this ensures we never accidentally log PHI in metadata.
 */
import { prisma, Prisma } from "@medflow/db";
import type { AuditAction } from "@medflow/db";

export interface AuditParams {
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  /** Non-PHI metadata only: status changes, field names (not values), counts */
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function audit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        resourceType: params.resourceType,
        userId: params.userId ?? null,
        resourceId: params.resourceId ?? null,
        ipAddress: params.ipAddress ?? null,
        userAgent: params.userAgent ?? null,
        // Omit metadata entirely when undefined (Prisma nullable JSON quirk)
        ...(params.metadata !== undefined ? { metadata: params.metadata as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (err) {
    // Audit failures must never crash the request
    console.error("Audit log write failed:", err);
  }
}
