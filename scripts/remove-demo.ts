// يحذف بيانات العرض التجريبية فقط (isDemo = true) قبل الإطلاق.
// لا يمس المحتوى الحقيقي ولا المستخدمين ولا الإعدادات (عدا روابط الرئيسية التي تشير لأصول تجريبية).
// الاستخدام: npm run demo:remove
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const demoAssets = (await db.mediaAsset.findMany({ where: { isDemo: true }, select: { id: true } })).map((a) => a.id);

  const res = await db.$transaction(async (tx) => {
    const homeFeatures = await tx.homeFeature.deleteMany({ where: { isDemo: true } });
    const settings = await tx.siteSettings.findUnique({ where: { id: 1 } });
    if (settings?.homeHeroImageId && demoAssets.includes(settings.homeHeroImageId)) {
      await tx.siteSettings.update({ where: { id: 1 }, data: { homeHeroImageId: null } });
    }
    // المواد المترجمة ترتبط بالأصل؛ نفك الربط قبل الحذف
    await tx.article.updateMany({ where: { isDemo: true }, data: { translationId: null } });
    const articles = await tx.article.deleteMany({ where: { isDemo: true } });
    const works = await tx.creativeWork.deleteMany({ where: { isDemo: true } });
    const events = await tx.event.deleteMany({ where: { isDemo: true } });
    const issues = await tx.issue.deleteMany({ where: { isDemo: true } });
    const creators = await tx.creator.deleteMany({ where: { isDemo: true } });
    const team = await tx.teamMember.deleteMany({ where: { isDemo: true } });
    const partners = await tx.partner.deleteMany({ where: { isDemo: true } });
    // الأصول التجريبية: تُحذف فقط إن لم يعد أي محتوى حقيقي يستخدمها
    const assets = await tx.mediaAsset.deleteMany({
      where: {
        isDemo: true,
        issueCovers: { none: {} }, issuePdfs: { none: {} }, issuePromos: { none: {} }, workThumbs: { none: {} }, workMedia: { none: {} },
        articleCovers: { none: {} }, creatorPhotos: { none: {} }, eventPosters: { none: {} }, eventMedia: { none: {} },
        teamPhotos: { none: {} }, partnerLogos: { none: {} }, homeFeatureImages: { none: {} }, homeHeroes: { none: {} },
      },
    });
    return { homeFeatures: homeFeatures.count, articles: articles.count, works: works.count, events: events.count, issues: issues.count, creators: creators.count, team: team.count, partners: partners.count, assets: assets.count };
  });
  console.log('تم حذف بيانات العرض التجريبية:', res);
  console.log('ملاحظة: ملفات الصور في public/demo باقية على القرص؛ احذف المجلد يدويًا إن لم تعد تحتاجها.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
