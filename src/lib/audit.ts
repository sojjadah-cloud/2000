import 'server-only';
import { db } from './db';
import type { SessionUser } from './auth';

export async function audit(user: SessionUser | null, action: string, entity: string, entityId: string | null, summary: string) {
  await db.auditLog.create({ data: { userId: user?.id ?? null, action, entity, entityId, summary } });
}
