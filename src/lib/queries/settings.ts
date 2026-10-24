import 'server-only';
import { cache } from 'react';
import { db } from '@/lib/db';
import { cached } from '@/lib/cache';

// تُقرأ في كل صفحة (التذييل والرئيسية): ذاكرة مؤقتة للعملية + تجميع داخل الطلب الواحد
const load = cached('settings', async () => {
  return (await db.siteSettings.findUnique({ where: { id: 1 } })) ?? (await db.siteSettings.create({ data: { id: 1 } }));
});

export const getSettings = cache(() => load());
