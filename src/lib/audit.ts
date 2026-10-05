/**
 * Audit logging helpers. All audit writes are fire-and-forget (non-blocking).
 * Failures are swallowed so they never break the primary request path.
 */
import { prisma } from './db';
import { log } from './logger';

const logger = log('audit');

export type AuditAction =
  | 'user.create'
  | 'user.delete'
  | 'user.role_change'
  | 'user.quota_change'
  | 'user.token_disable'
  | 'user.token_enable'
  | 'settings.update'
  | 'file.delete_bulk'
  | 'file.delete'
  | 'invite.create'
  | 'invite.delete';

export interface AuditParams {
  action: AuditAction;
  actorId?: string | null;
  actorName?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  meta?: Record<string, unknown>;
}

export function writeAuditLog(params: AuditParams): void {
  prisma.auditLog
    .create({
      data: {
        action: params.action,
        actorId: params.actorId ?? null,
        actorName: params.actorName ?? null,
        targetId: params.targetId ?? null,
        targetType: params.targetType ?? null,
        meta: (params.meta ?? {}) as any,
      },
    })
    .catch((err: Error) => logger.error('failed to write audit log', { error: err.message }));
}
