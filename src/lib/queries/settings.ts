import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';

export const getSettings = cache(async () => {
  return (await db.siteSettings.findUnique({ where: { id: 1 } })) ?? (await db.siteSettings.create({ data: { id: 1 } }));
});
