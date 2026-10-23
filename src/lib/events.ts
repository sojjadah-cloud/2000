// حالة التسجيل المحسوبة للفعالية — منطق نقي يُستخدم في الواجهة والخادم.

export type RegistrationState = 'OPEN' | 'FULL' | 'WAITLIST' | 'CLOSED' | 'POSTPONED' | 'CANCELLED' | 'ENDED' | 'NOT_REQUIRED';

export function registrationState(
  e: {
    lifecycle: 'SCHEDULED' | 'POSTPONED' | 'CANCELLED';
    endsAt: Date;
    registrationEnabled: boolean;
    registrationOpensAt: Date | null;
    registrationClosesAt: Date | null;
    capacity: number | null;
    waitlistEnabled: boolean;
  },
  confirmedCount: number,
  now = new Date(),
): RegistrationState {
  if (e.lifecycle === 'CANCELLED') return 'CANCELLED';
  if (e.lifecycle === 'POSTPONED') return 'POSTPONED';
  if (e.endsAt < now) return 'ENDED';
  if (!e.registrationEnabled) return 'NOT_REQUIRED';
  if (e.registrationOpensAt && now < e.registrationOpensAt) return 'CLOSED';
  if (e.registrationClosesAt && now > e.registrationClosesAt) return 'CLOSED';
  if (e.capacity != null && confirmedCount >= e.capacity) return e.waitlistEnabled ? 'WAITLIST' : 'FULL';
  return 'OPEN';
}

export const STATE_TONE: Record<RegistrationState, string> = {
  OPEN: 'bg-mint text-navy',
  WAITLIST: 'bg-yellow-50 text-navy',
  FULL: 'bg-pink-50 text-burgundy',
  CLOSED: 'bg-chip text-ink-muted',
  POSTPONED: 'bg-yellow-50 text-burgundy',
  CANCELLED: 'bg-pink-50 text-burgundy',
  ENDED: 'bg-chip text-ink-muted',
  NOT_REQUIRED: 'bg-chip text-navy',
};
