import type { PublishStatus } from '@prisma/client';

/**
 * شرط الظهور للعامة: منشور، أو مجدول حلّ موعده.
 * كل استعلام عام يمرّ عبر هذا الشرط حتى لا تتسرب المسودات.
 */
export function publicWhere(now = new Date()) {
  return {
    status: { in: ['PUBLISHED', 'SCHEDULED'] as PublishStatus[] },
    publishedAt: { lte: now },
  };
}

export function isPublic(item: { status: PublishStatus; publishedAt: Date | null }, now = new Date()) {
  return (item.status === 'PUBLISHED' || item.status === 'SCHEDULED') && !!item.publishedAt && item.publishedAt <= now;
}

/** المبدع يظهر للعامة فقط بعد الموافقة والاعتماد. */
export const publicCreatorWhere = {
  approval: 'APPROVED' as const,
  consentGiven: true,
  archivedAt: null,
};
