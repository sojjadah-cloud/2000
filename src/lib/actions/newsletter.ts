'use server';

import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/tokens';

// تغيير حالة الاشتراك يتم بزر (POST) وليس بمجرد فتح الرابط،
// لأن برامج فحص البريد تفتح الروابط تلقائيًا.

export async function confirmSubscription(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const sub = token ? await db.subscriber.findUnique({ where: { confirmTokenHash: hashToken(token) } }) : null;
  if (!sub) redirect(`/newsletter/confirm/${encodeURIComponent(token)}?invalid=1`);
  await db.subscriber.update({ where: { id: sub.id }, data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmTokenHash: null, unsubscribedAt: null } });
  redirect(`/newsletter/confirm/${encodeURIComponent(token)}?done=1`);
}

export async function setSubscription(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const action = formData.get('action') === 'resubscribe' ? 'resubscribe' : 'unsubscribe';
  const sub = token ? await db.subscriber.findUnique({ where: { manageTokenHash: hashToken(token) } }) : null;
  if (!sub) redirect(`/newsletter/manage/${encodeURIComponent(token)}`);
  await db.subscriber.update({
    where: { id: sub.id },
    data: action === 'unsubscribe' ? { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() } : { status: 'CONFIRMED', unsubscribedAt: null, confirmedAt: sub.confirmedAt ?? new Date() },
  });
  redirect(`/newsletter/manage/${encodeURIComponent(token)}?updated=${action}`);
}
