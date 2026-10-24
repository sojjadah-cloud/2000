// تحديث لمرة واحدة لنصوص المحتوى الأولي على قواعد البيانات القائمة.
// يغيّر الحقل فقط إذا كان ما زال يحمل النص القديم، فلا يمس أي تعديل لاحق من الفريق.
import { PrismaClient } from '@prisma/client';
import { ABOUT, ISSUE13_EDITORIAL, OLD_ARTICLE_NOTE_AR, OLD_ARTICLE_NOTE_EN, POEM_AR, POEM_EN, POEM_EXCERPT, WORK_COPY } from './demo-copy';

export const COPY_PATCH_ID = 'copy-cleanup-1';

export async function patchCopy(db: PrismaClient) {
  let changed = 0;
  const bump = (n: number) => (changed += n);

  bump((await db.creator.updateMany({ where: { isDemo: true, bio: { startsWith: 'نبذة تجريبية' } }, data: { bio: null, bioEn: null } })).count);

  for (const [slug, copy] of Object.entries(WORK_COPY)) {
    bump((await db.creativeWork.updateMany({ where: { slug, isDemo: true, description: { contains: 'وصف تجريبي' } }, data: { description: `<p>${copy.ar}</p>`, descriptionEn: `<p>${copy.en}</p>` } })).count);
  }

  bump((await db.issue.updateMany({ where: { slug: 'issue-13', isDemo: true, editorialHtml: { contains: 'كلمة تحرير تجريبية' } }, data: { editorialHtml: ISSUE13_EDITORIAL } })).count);

  const articles = await db.article.findMany({ where: { isDemo: true }, select: { id: true, slug: true, lang: true, bodyHtml: true, excerpt: true, sources: true } });
  for (const a of articles) {
    const data: Record<string, string | null> = {};
    if (a.sources?.includes('مصدر تجريبي')) data.sources = null;
    if (a.slug === 'a-poem-for-the-sea' && a.bodyHtml.includes('نص تجريبي')) Object.assign(data, { bodyHtml: POEM_AR, excerpt: POEM_EXCERPT.ar });
    else if (a.slug === 'a-poem-for-the-sea-en' && a.bodyHtml.includes('demo poem')) Object.assign(data, { bodyHtml: POEM_EN, excerpt: POEM_EXCERPT.en });
    else {
      const body = a.bodyHtml.replace(a.lang === 'en' ? OLD_ARTICLE_NOTE_EN : OLD_ARTICLE_NOTE_AR, '');
      if (body !== a.bodyHtml) data.bodyHtml = body;
    }
    if (Object.keys(data).length) {
      await db.article.update({ where: { id: a.id }, data });
      bump(1);
    }
  }

  bump((await db.event.updateMany({ where: { isDemo: true, descriptionHtml: { contains: 'وصف تجريبي' } }, data: { descriptionHtml: '' } })).count);

  const s = await db.siteSettings.findUnique({ where: { id: 1 } });
  if (s && [s.aboutStory, s.aboutVision, s.aboutMission].some((x) => x?.startsWith('نص مبدئي'))) {
    await db.siteSettings.update({ where: { id: 1 }, data: { aboutStory: ABOUT.story, aboutVision: ABOUT.vision, aboutMission: ABOUT.mission } });
    bump(1);
  }
  return changed;
}

// تشغيل مباشر: npx tsx prisma/patch-copy.ts
if (process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/patch-copy.ts')) {
  const db = new PrismaClient();
  patchCopy(db)
    .then(async (n) => {
      await db.appMeta.upsert({ where: { key: 'copy_patch' }, create: { key: 'copy_patch', value: COPY_PATCH_ID }, update: { value: COPY_PATCH_ID } });
      console.log(`[patch] تم تحديث ${n} سجل.`);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => db.$disconnect());
}
