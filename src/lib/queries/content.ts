import 'server-only';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isPublic, publicCreatorWhere, publicWhere } from '@/lib/publish';
import { normalizeForSearch } from '@/lib/text';
import { cached } from '@/lib/cache';

// طبقة الوصول العامة: كل دالة هنا تُرجع المحتوى المنشور فقط
// ولا تُرجع الحقول الخاصة (بريد المبدع، ملاحظات الفريق...).

export const PAGE_SIZE = { works: 8, articles: 6, issues: 6, creators: 12, events: 9 };

const creatorPublicSelect = {
  id: true, slug: true, displayName: true, displayNameEn: true, headline: true, headlineEn: true, approval: true, consentGiven: true, archivedAt: true,
} satisfies Prisma.CreatorSelect;

/** يُبقي فقط المبدعين المعتمدين للعرض كروابط؛ غير المعتمد يظهر اسمه دون رابط. */
export function creditName(c: { displayName: string; approval: string; consentGiven: boolean; archivedAt: Date | null; slug: string }) {
  const linkable = c.approval === 'APPROVED' && c.consentGiven && !c.archivedAt;
  return { name: c.displayName, href: linkable ? `/creators/${c.slug}` : null };
}

const mediaSelect = { id: true, url: true, width: true, height: true, altAr: true, altEn: true, credit: true, rights: true, mime: true, kind: true } satisfies Prisma.MediaAssetSelect;
export type MediaLite = Prisma.MediaAssetGetPayload<{ select: typeof mediaSelect }>;

// ───────── الأعداد ─────────

const issueCard = {
  id: true, number: true, slug: true, title: true, titleEn: true, theme: true, themeEn: true, summary: true, summaryEn: true,
  releaseDate: true, format: true, language: true, editionNote: true, pdfId: true, cover: { select: mediaSelect },
  promoImage: { select: mediaSelect },
} satisfies Prisma.IssueSelect;
export type IssueCard = Prisma.IssueGetPayload<{ select: typeof issueCard }>;

async function latestIssueQuery(preferredId?: string | null) {
  if (preferredId) {
    const preferred = await db.issue.findFirst({ where: { id: preferredId, ...publicWhere() }, select: issueCard });
    if (preferred) return preferred;
  }
  return db.issue.findFirst({ where: publicWhere(), orderBy: [{ number: 'desc' }], select: issueCard });
}

async function listIssuesQuery(opts: { q?: string; year?: number; format?: 'DIGITAL' | 'PRINT'; page?: number }) {
  const where: Prisma.IssueWhereInput = { ...publicWhere() };
  if (opts.q) where.searchText = { contains: normalizeForSearch(opts.q) };
  if (opts.year) where.releaseDate = { gte: new Date(Date.UTC(opts.year, 0, 1)), lt: new Date(Date.UTC(opts.year + 1, 0, 1)) };
  if (opts.format === 'DIGITAL') where.format = { in: ['DIGITAL', 'BOTH'] };
  if (opts.format === 'PRINT') where.format = { in: ['PRINT', 'BOTH'] };
  const page = Math.max(1, opts.page ?? 1);
  const [items, total] = await Promise.all([
    db.issue.findMany({ where, orderBy: { number: 'desc' }, select: issueCard, take: PAGE_SIZE.issues * page }),
    db.issue.count({ where }),
  ]);
  return { items, total, page, hasMore: items.length < total };
}

async function issueYearsQuery() {
  const rows = await db.issue.findMany({ where: publicWhere(), select: { releaseDate: true } });
  return [...new Set(rows.map((r) => r.releaseDate?.getUTCFullYear()).filter((y): y is number => !!y))].sort((a, b) => b - a);
}

export function issueDetailInclude() {
  return {
    cover: { select: mediaSelect },
    promoImage: { select: mediaSelect },
    pdf: { select: mediaSelect },
    team: { orderBy: { sortOrder: 'asc' as const }, include: { creator: { select: creatorPublicSelect } } },
    works: {
      where: publicWhere(),
      orderBy: { issueOrder: 'asc' as const },
      select: { id: true, slug: true, title: true, titleEn: true, issueOrder: true, category: true, creators: { include: { creator: { select: creatorPublicSelect } } } },
    },
    articles: {
      where: { ...publicWhere(), ...originalsOnly },
      orderBy: { issueOrder: 'asc' as const },
      select: {
        id: true, slug: true, title: true, excerpt: true, lang: true, issueOrder: true, category: true,
        translation: { select: { slug: true, title: true, excerpt: true, lang: true, status: true, publishedAt: true } },
        authors: { include: { creator: { select: creatorPublicSelect } } },
      },
    },
  } satisfies Prisma.IssueInclude;
}
export type IssueDetail = Prisma.IssueGetPayload<{ include: ReturnType<typeof issueDetailInclude> }>;

async function getIssueQuery(slug: string) {
  return db.issue.findFirst({ where: { slug, ...publicWhere() }, include: issueDetailInclude() });
}

async function relatedIssuesQuery(excludeId: string) {
  return db.issue.findMany({ where: { ...publicWhere(), id: { not: excludeId } }, orderBy: { number: 'desc' }, take: 3, select: issueCard });
}

// ───────── الأعمال ─────────

const workCard = {
  id: true, slug: true, title: true, titleEn: true, editorsPick: true, videoUrl: true, publishedAt: true,
  category: true, thumbnail: { select: mediaSelect },
  creators: { orderBy: { sortOrder: 'asc' }, include: { creator: { select: creatorPublicSelect } } },
} satisfies Prisma.CreativeWorkSelect;
export type WorkCard = Prisma.CreativeWorkGetPayload<{ select: typeof workCard }>;

async function listWorksQuery(opts: { q?: string; category?: string; sort?: 'new' | 'old'; page?: number }) {
  const where: Prisma.CreativeWorkWhereInput = { ...publicWhere() };
  if (opts.category) where.category = { slug: opts.category, scope: 'WORK' };
  if (opts.q) {
    const q = normalizeForSearch(opts.q);
    where.OR = [{ searchText: { contains: q } }, { creators: { some: { creator: { searchText: { contains: q } } } } }];
  }
  const page = Math.max(1, opts.page ?? 1);
  const orderBy: Prisma.CreativeWorkOrderByWithRelationInput[] =
    opts.sort === 'old' ? [{ publishedAt: 'asc' }] : [{ sortOrder: 'asc' }, { publishedAt: 'desc' }];
  const [items, total] = await Promise.all([
    db.creativeWork.findMany({ where, orderBy, select: workCard, take: PAGE_SIZE.works * page }),
    db.creativeWork.count({ where }),
  ]);
  return { items, total, page, hasMore: items.length < total };
}

export function workDetailInclude() {
  return {
    category: true,
    thumbnail: { select: mediaSelect },
    media: { orderBy: { sortOrder: 'asc' as const }, include: { asset: { select: mediaSelect } } },
    creators: {
      orderBy: { sortOrder: 'asc' as const },
      include: { creator: { select: { ...creatorPublicSelect, bio: true, bioEn: true, photo: { select: mediaSelect } } } },
    },
    issue: { select: { slug: true, number: true, title: true, titleEn: true, theme: true, themeEn: true, status: true, publishedAt: true } },
    tags: true,
  } satisfies Prisma.CreativeWorkInclude;
}
export type WorkDetail = Prisma.CreativeWorkGetPayload<{ include: ReturnType<typeof workDetailInclude> }>;

async function getWorkQuery(slug: string) {
  return db.creativeWork.findFirst({ where: { slug, ...publicWhere() }, include: workDetailInclude() });
}

async function relatedWorksQuery(work: { id: string; categoryId: string }) {
  return db.creativeWork.findMany({
    where: { ...publicWhere(), id: { not: work.id }, categoryId: work.categoryId },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: workCard,
  });
}

// ───────── المقالات ─────────

const articleCard = {
  id: true, slug: true, title: true, excerpt: true, lang: true, publishedAt: true, readingMinutes: true, featured: true,
  category: true, cover: { select: mediaSelect }, tags: { take: 1, select: { nameAr: true, nameEn: true } },
  authors: { orderBy: { sortOrder: 'asc' }, include: { creator: { select: creatorPublicSelect } } },
  translation: { select: { slug: true, title: true, excerpt: true, lang: true, status: true, publishedAt: true } },
} satisfies Prisma.ArticleSelect;
export type ArticleCard = Prisma.ArticleGetPayload<{ select: typeof articleCard }>;

/** القوائم تعرض المواد الأصلية فقط؛ الترجمة تظهر بدلًا منها حين تطابق لغة الواجهة. */
const originalsOnly: Prisma.ArticleWhereInput = { translationOf: { is: null } };

/** عنوان المادة ومقدمتها ورابطها بلغة الواجهة إن وُجدت ترجمة منشورة، وإلا الأصل. */
export function localizeArticle(a: Pick<ArticleCard, 'slug' | 'title' | 'excerpt' | 'lang' | 'translation'>, lang: 'ar' | 'en') {
  const t = a.translation;
  if (t && t.lang === lang && a.lang !== lang && isPublic(t)) return { slug: t.slug, title: t.title, excerpt: t.excerpt, lang: t.lang };
  return { slug: a.slug, title: a.title, excerpt: a.excerpt, lang: a.lang };
}

async function listArticlesQuery(opts: { q?: string; category?: string; page?: number; excludeIds?: string[]; take?: number }) {
  const where: Prisma.ArticleWhereInput = { ...publicWhere(), ...originalsOnly };
  if (opts.category) where.category = { slug: opts.category, scope: 'ARTICLE' };
  if (opts.excludeIds?.length) where.id = { notIn: opts.excludeIds };
  if (opts.q) {
    const q = normalizeForSearch(opts.q);
    where.OR = [{ searchText: { contains: q } }, { authors: { some: { creator: { searchText: { contains: q } } } } }];
  }
  const page = Math.max(1, opts.page ?? 1);
  const take = opts.take ?? PAGE_SIZE.articles * page;
  const [items, total] = await Promise.all([
    db.article.findMany({ where, orderBy: [{ publishedAt: 'desc' }], select: articleCard, take }),
    db.article.count({ where }),
  ]);
  return { items, total, page, hasMore: items.length < total };
}

async function featuredArticleQuery(category?: string) {
  return db.article.findFirst({
    where: { ...publicWhere(), ...originalsOnly, featured: true, ...(category ? { category: { slug: category, scope: 'ARTICLE' as const } } : {}) },
    orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }],
    select: articleCard,
  });
}

export function articleDetailInclude() {
  return {
    category: true,
    cover: { select: mediaSelect },
    authors: {
      orderBy: { sortOrder: 'asc' as const },
      include: { creator: { select: { ...creatorPublicSelect, bio: true, bioEn: true, photo: { select: mediaSelect } } } },
    },
    issue: { select: { slug: true, number: true, title: true, titleEn: true, theme: true, themeEn: true, status: true, publishedAt: true } },
    tags: true,
    translation: { select: { slug: true, lang: true, title: true, status: true, publishedAt: true } },
    translationOf: { select: { id: true, slug: true, lang: true, title: true, categoryId: true, status: true, publishedAt: true } },
  } satisfies Prisma.ArticleInclude;
}
export type ArticleDetail = Prisma.ArticleGetPayload<{ include: ReturnType<typeof articleDetailInclude> }>;

async function getArticleQuery(slug: string) {
  return db.article.findFirst({ where: { slug, ...publicWhere() }, include: articleDetailInclude() });
}

async function relatedArticlesQuery(a: { id: string; categoryId: string; excludeId?: string }) {
  return db.article.findMany({
    where: { ...publicWhere(), ...originalsOnly, id: { notIn: [a.id, a.excludeId].filter((x): x is string => !!x) }, categoryId: a.categoryId },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: articleCard,
  });
}

// ───────── الفعاليات ─────────

const eventCard = {
  id: true, slug: true, title: true, titleEn: true, summary: true, summaryEn: true, startsAt: true, endsAt: true, timezone: true,
  venue: true, venueEn: true, onlineUrl: true, lifecycle: true, capacity: true, waitlistEnabled: true, registrationEnabled: true,
  registrationOpensAt: true, registrationClosesAt: true, category: true, poster: { select: mediaSelect },
  _count: { select: { registrations: { where: { status: 'CONFIRMED' } } } },
} satisfies Prisma.EventSelect;
export type EventCard = Prisma.EventGetPayload<{ select: typeof eventCard }>;

async function upcomingEventsQuery(take = 6, category?: string) {
  return db.event.findMany({
    where: { ...publicWhere(), endsAt: { gte: new Date() }, ...(category ? { category: { slug: category, scope: 'EVENT' as const } } : {}) },
    orderBy: { startsAt: 'asc' },
    take,
    select: eventCard,
  });
}

async function pastEventsQuery(page = 1, category?: string) {
  const where: Prisma.EventWhereInput = { ...publicWhere(), endsAt: { lt: new Date() }, ...(category ? { category: { slug: category, scope: 'EVENT' } } : {}) };
  const [items, total] = await Promise.all([
    db.event.findMany({ where, orderBy: { startsAt: 'desc' }, take: PAGE_SIZE.events * page, select: eventCard }),
    db.event.count({ where }),
  ]);
  return { items, total, page, hasMore: items.length < total };
}

export function eventDetailInclude() {
  return {
    category: true,
    poster: { select: mediaSelect },
    speakers: { orderBy: { sortOrder: 'asc' as const }, include: { creator: { select: creatorPublicSelect } } },
    partners: { where: { visible: true }, orderBy: { sortOrder: 'asc' as const }, include: { logo: { select: mediaSelect } } },
    media: { orderBy: { sortOrder: 'asc' as const }, include: { asset: { select: mediaSelect } } },
    _count: { select: { registrations: { where: { status: 'CONFIRMED' as const } } } },
  } satisfies Prisma.EventInclude;
}
export type EventDetail = Prisma.EventGetPayload<{ include: ReturnType<typeof eventDetailInclude> }>;

export async function getEvent(slug: string) {
  return db.event.findFirst({ where: { slug, ...publicWhere() }, include: eventDetailInclude() });
}

// ───────── المبدعون ─────────

const creatorCard = {
  id: true, slug: true, displayName: true, displayNameEn: true, headline: true, headlineEn: true, bio: true, bioEn: true,
  openToCollab: true, city: true, fields: true, photo: { select: mediaSelect },
} satisfies Prisma.CreatorSelect;
export type CreatorCard = Prisma.CreatorGetPayload<{ select: typeof creatorCard }>;

async function listCreatorsQuery(opts: { q?: string; field?: string; page?: number }) {
  const where: Prisma.CreatorWhereInput = { ...publicCreatorWhere };
  if (opts.q) where.searchText = { contains: normalizeForSearch(opts.q) };
  if (opts.field) where.fields = { some: { slug: opts.field, scope: 'FIELD' } };
  const page = Math.max(1, opts.page ?? 1);
  const [items, total] = await Promise.all([
    db.creator.findMany({ where, orderBy: { displayName: 'asc' }, select: creatorCard, take: PAGE_SIZE.creators * page }),
    db.creator.count({ where }),
  ]);
  return { items, total, page, hasMore: items.length < total };
}

async function getCreatorQuery(slug: string) {
  return db.creator.findFirst({
    where: { slug, ...publicCreatorWhere },
    select: {
      ...creatorCard,
      quote: true,
      quoteEn: true,
      website: true,
      socialLinks: true,
      works: { where: { work: publicWhere() }, orderBy: { sortOrder: 'asc' }, select: { work: { select: workCard } } },
      articles: { where: { article: { ...publicWhere(), ...originalsOnly } }, select: { article: { select: articleCard } } },
      issues: { where: { issue: publicWhere() }, select: { role: true, issue: { select: issueCard } } },
      events: { where: { event: publicWhere() }, select: { event: { select: eventCard } } },
    },
  });
}

export const categories = cached('categories', async (scope: 'WORK' | 'ARTICLE' | 'EVENT' | 'FIELD') =>
  db.category.findMany({ where: { scope }, orderBy: { sortOrder: 'asc' } }),
);

// ───────── الرئيسية ─────────

async function homeFeaturesQuery(slot: string) {
  return db.homeFeature.findMany({
    where: { slot, active: true },
    orderBy: { sortOrder: 'asc' },
    include: { imageOverride: { select: mediaSelect } },
  });
}

async function resolveFeatureTargetsQuery(features: Awaited<ReturnType<typeof homeFeatures>>, lang: 'ar' | 'en') {
  const personName = (c: { displayName: string; displayNameEn: string | null }) => (lang === 'en' && c.displayNameEn ? c.displayNameEn : c.displayName);
  const ids = (type: string) => features.filter((f) => f.targetType === type).map((f) => f.targetId);
  const [works, articles] = await Promise.all([
    db.creativeWork.findMany({ where: { id: { in: ids('WORK') }, ...publicWhere() }, select: workCard }),
    db.article.findMany({ where: { id: { in: ids('ARTICLE') }, ...publicWhere() }, select: articleCard }),
  ]);
  return features
    .map((f) => {
      if (f.targetType === 'WORK') {
        const w = works.find((x) => x.id === f.targetId);
        if (!w) return null;
        return {
          id: f.id, href: `/works/${w.slug}`, title: w.title, titleEn: w.titleEn, titleLang: null as string | null,
          label: w.category.nameAr, labelEn: w.category.nameEn,
          people: w.creators.map((c) => personName(c.creator)), image: f.imageOverride ?? w.thumbnail,
        };
      }
      if (f.targetType === 'ARTICLE') {
        const a = articles.find((x) => x.id === f.targetId);
        if (!a) return null;
        const loc = localizeArticle(a, lang);
        return {
          // الوسم (مثل: ثقافة) يُقدَّم على التصنيف كما في المرجع
          id: f.id, href: `/articles/${loc.slug}`, title: loc.title, titleEn: null, titleLang: loc.lang,
          label: a.tags[0]?.nameAr ?? a.category.nameAr, labelEn: a.tags[0]?.nameEn ?? a.category.nameEn,
          people: a.authors.map((c) => personName(c.creator)), image: f.imageOverride ?? a.cover,
        };
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => !!x);
}

async function spotlightCreatorQuery() {
  const f = await db.homeFeature.findFirst({ where: { slot: 'SPOTLIGHT', active: true, targetType: 'CREATOR' }, orderBy: { sortOrder: 'asc' }, include: { imageOverride: { select: mediaSelect } } });
  if (!f) return null;
  const c = await db.creator.findFirst({ where: { id: f.targetId, ...publicCreatorWhere }, select: { ...creatorCard, quote: true, quoteEn: true } });
  if (!c) return null;
  return { ...c, image: f.imageOverride ?? c.photo };
}

// ───────── واجهات مخزّنة مؤقتًا (60 ثانية؛ تُفرغ عند الحفظ من الإدارة) ─────────
// getEvent غير مخزّن: عدد المقاعد المتبقية يجب أن يكون دقيقًا.
export const latestIssue = cached('latestIssue', latestIssueQuery);
export const listIssues = cached('listIssues', listIssuesQuery);
export const issueYears = cached('issueYears', issueYearsQuery);
export const getIssue = cached('getIssue', getIssueQuery);
export const relatedIssues = cached('relatedIssues', relatedIssuesQuery);
export const listWorks = cached('listWorks', listWorksQuery);
export const getWork = cached('getWork', getWorkQuery);
export const relatedWorks = cached('relatedWorks', relatedWorksQuery);
export const listArticles = cached('listArticles', listArticlesQuery);
export const featuredArticle = cached('featuredArticle', featuredArticleQuery);
export const getArticle = cached('getArticle', getArticleQuery);
export const relatedArticles = cached('relatedArticles', relatedArticlesQuery);
export const upcomingEvents = cached('upcomingEvents', upcomingEventsQuery);
export const pastEvents = cached('pastEvents', pastEventsQuery);
export const listCreators = cached('listCreators', listCreatorsQuery);
export const getCreator = cached('getCreator', getCreatorQuery);
export const homeFeatures = cached('homeFeatures', homeFeaturesQuery);
export const resolveFeatureTargets = cached('resolveFeatureTargets', resolveFeatureTargetsQuery);
export const spotlightCreator = cached('spotlightCreator', spotlightCreatorQuery);
