import 'server-only';
import { db } from '@/lib/db';
import { publicCreatorWhere, publicWhere } from '@/lib/publish';
import { normalizeForSearch } from '@/lib/text';

// البحث العام: المحتوى المنشور فقط، والحقول العامة فقط.
// يطابق النص المطبّع (الهمزات، التاء المربوطة، الياء، التشكيل) دون تغيير النص الأصلي.

const PER_TYPE = 6;

export async function siteSearch(query: string) {
  const q = normalizeForSearch(query);
  if (q.length < 2) return null;
  const terms = q.split(' ').filter((w) => w.length > 1).slice(0, 5);
  const all = (field: string) => ({ AND: terms.map((w) => ({ [field]: { contains: w } })) });
  const now = new Date();

  const [issues, works, articles, creators, events] = await Promise.all([
    db.issue.findMany({ where: { ...publicWhere(now), ...all('searchText') }, orderBy: { number: 'desc' }, take: PER_TYPE, select: { slug: true, title: true, titleEn: true, theme: true, themeEn: true, summary: true, summaryEn: true } }),
    db.creativeWork.findMany({ where: { ...publicWhere(now), ...all('searchText') }, orderBy: { publishedAt: 'desc' }, take: PER_TYPE, select: { slug: true, title: true, titleEn: true, category: { select: { nameAr: true, nameEn: true } } } }),
    db.article.findMany({ where: { ...publicWhere(now), ...all('searchText') }, orderBy: { publishedAt: 'desc' }, take: PER_TYPE * 2, select: { slug: true, title: true, excerpt: true, lang: true, translationOf: { select: { id: true } }, translation: { select: { id: true } } } }),
    db.creator.findMany({ where: { ...publicCreatorWhere, ...all('searchText') }, orderBy: { displayName: 'asc' }, take: PER_TYPE, select: { slug: true, displayName: true, displayNameEn: true, headline: true, headlineEn: true } }),
    db.event.findMany({ where: { ...publicWhere(now), ...all('searchText') }, orderBy: { startsAt: 'desc' }, take: PER_TYPE, select: { slug: true, title: true, titleEn: true, summary: true, summaryEn: true, startsAt: true, timezone: true } }),
  ]);
  return { issues, works, articles, creators, events, total: issues.length + works.length + articles.length + creators.length + events.length };
}
