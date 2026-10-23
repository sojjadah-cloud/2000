// بيانات العرض التجريبية — مأخوذة من التصاميم المرجعية لعرض مطابق.
// كل السجلات موسومة isDemo=true وتُحذف بـ: npm run demo:remove
// العناوين والأسماء والتواريخ هنا للعرض فقط وليست معلومات موثقة.
import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { DEFAULT_ROLES } from '../src/lib/permissions';
import { buildSearchText, readingMinutes } from '../src/lib/text';

const db = new PrismaClient();

// أبعاد الأصول المقصوصة (انظر design-refs/ASSETS.md)
const IMAGES: Record<string, [number, number, string, string]> = {
  // key: [w, h, alt, source]
  'home-hero-magazines': [520, 414, 'نسختان مطبوعتان من مجلة ألفين، غلاف برتقالي وغلاف كحلي', 'design-refs/home.png'],
  'issues-hero-magazines': [445, 405, 'نسختان مطبوعتان من مجلة ألفين، غلاف برتقالي وغلاف كحلي', 'design-refs/num.png'],
  'pick-old-alleys': [306, 178, 'رجل بالزي العُماني يسير في زقاق طيني قديم', 'design-refs/home.png'],
  'pick-color-memory': [300, 178, 'لوحة لوجه امرأة على خلفية لونية متداخلة', 'design-refs/home.png'],
  'pick-place-shadows': [304, 178, 'سور قلعة تنعكس عليه ظلال سعف النخيل', 'design-refs/home.png'],
  'writing-oman-spaces': [105, 77, 'قلعة على ساحل صخري', 'design-refs/home.png'],
  'writing-sound-identity': [105, 82, 'يدان تعزفان على العود', 'design-refs/home.png'],
  'writing-city-i-see': [105, 79, 'ظل سعف نخلة على جدار', 'design-refs/home.png'],
  'spotlight-sara': [233, 293, 'مصوّرة ترتدي عباءة سوداء تلتقط صورة في حي قديم', 'design-refs/home.png'],
  'event-creativity-place': [243, 79, 'أقواس بيضاء وسعف نخيل', 'design-refs/home.png'],
  'cover-13': [170, 250, 'غلاف العدد الثالث عشر', 'design-refs/num.png'],
  'cover-12': [172, 250, 'غلاف العدد الثاني عشر', 'design-refs/num.png'],
  'cover-11': [172, 250, 'غلاف العدد الحادي عشر', 'design-refs/num.png'],
  'cover-10': [170, 249, 'غلاف العدد العاشر', 'design-refs/num.png'],
  'cover-09': [172, 249, 'غلاف العدد التاسع', 'design-refs/num.png'],
  'cover-08': [172, 249, 'غلاف العدد الثامن', 'design-refs/num.png'],
  'work-place-shadows': [273, 356, 'رجل بالزي العُماني يسير في زقاق طيني نحو برج قديم', 'design-refs/indatat.png'],
  'work-memory-features': [273, 356, 'لوحة لوجه امرأة بوشاح مزخرف على خلفية لونية', 'design-refs/indatat.png'],
  'work-letters-rhythm': [271, 356, 'تصميم حروفي لشعار ألفين بالبرتقالي والكحلي', 'design-refs/indatat.png'],
  'work-sea-tale': [271, 188, 'قلعة على صخور ساحلية عند الغروب', 'design-refs/indatat.png'],
  'work-behind-scene': [274, 188, 'شاب يرتدي الكمة خلف كاميرا تصوير سينمائي', 'design-refs/indatat.png'],
  'work-free-spaces': [271, 188, 'لوحة تجريدية بالأزرق والبرتقالي', 'design-refs/indatat.png'],
  'work-light-patterns': [464, 193, 'جدران بيضاء بأقواس وظلال سعف', 'design-refs/indatat.png'],
  'work-growing-details': [368, 155, 'رسم نباتي لأغصان وأزهار بيضاء', 'design-refs/indatat.png'],
};

// الوصف البديل بالإنجليزية لكل أصل
const ALT_EN: Record<string, string> = {
  'home-hero-magazines': 'Two printed copies of Alfeen magazine, one orange cover and one navy cover',
  'issues-hero-magazines': 'Two printed copies of Alfeen magazine, one orange cover and one navy cover',
  'pick-old-alleys': 'A man in Omani dress walking through an old mud-brick alley',
  'pick-color-memory': "Painting of a woman's face over layered colours",
  'pick-place-shadows': 'Palm frond shadows on a fort wall',
  'writing-oman-spaces': 'A fort on a rocky coastline',
  'writing-sound-identity': 'Hands playing the oud',
  'writing-city-i-see': 'Shadow of a palm frond on a wall',
  'spotlight-sara': 'A photographer in a black abaya taking a photo in an old neighbourhood',
  'event-creativity-place': 'White arches and palm fronds',
  'cover-13': 'Cover of issue 13',
  'cover-12': 'Cover of issue 12',
  'cover-11': 'Cover of issue 11',
  'cover-10': 'Cover of issue 10',
  'cover-09': 'Cover of issue 9',
  'cover-08': 'Cover of issue 8',
  'work-place-shadows': 'A man in Omani dress walking down a mud-brick alley toward an old tower',
  'work-memory-features': 'Painting of a woman in a patterned scarf over a colourful background',
  'work-letters-rhythm': 'Lettering design of the Alfeen logo in orange and navy',
  'work-sea-tale': 'A fort on coastal rocks at sunset',
  'work-behind-scene': 'A young man in a kumma behind a cinema camera',
  'work-free-spaces': 'Abstract painting in blue and orange',
  'work-light-patterns': 'White walls with arches and palm shadows',
  'work-growing-details': 'Botanical drawing of branches and white flowers',
};

function genPassword() {
  return randomBytes(12).toString('base64url');
}

async function main() {
  // ───── الأدوار والمستخدمون ─────
  const roles: Record<string, string> = {};
  for (const r of DEFAULT_ROLES) {
    const role = await db.role.upsert({
      where: { key: r.key },
      create: { key: r.key, nameAr: r.nameAr, nameEn: r.nameEn, permissions: r.permissions },
      update: { nameAr: r.nameAr, nameEn: r.nameEn, permissions: r.permissions },
    });
    roles[r.key] = role.id;
  }

  // حسابات التطوير: كلمات مرور عشوائية تُحفظ في ملف محلي مستبعد من git
  const credsFile = '.data/dev-credentials.txt';
  if (!(await db.user.count())) {
    const lines: string[] = ['# حسابات التطوير المحلية — لا تُستخدم في الإنتاج', ''];
    const accounts = [
      { key: 'admin', email: process.env.SEED_ADMIN_EMAIL || 'admin@alfeen.test', name: 'مدير المنصة', password: process.env.SEED_ADMIN_PASSWORD || genPassword() },
      { key: 'editor', email: 'editor@alfeen.test', name: 'محرر تجريبي', password: genPassword() },
      { key: 'reviewer', email: 'reviewer@alfeen.test', name: 'مراجع تجريبي', password: genPassword() },
      { key: 'events', email: 'events@alfeen.test', name: 'مسؤول فعاليات تجريبي', password: genPassword() },
    ];
    for (const a of accounts) {
      await db.user.create({ data: { email: a.email, name: a.name, roleId: roles[a.key], passwordHash: await bcrypt.hash(a.password, 12) } });
      lines.push(`${a.key}\t${a.email}\t${a.password}`);
    }
    mkdirSync('.data', { recursive: true });
    writeFileSync(credsFile, lines.join('\n') + '\n', 'utf8');
    console.log(`حسابات التطوير محفوظة في ${credsFile}`);
  }

  // ───── التصنيفات ─────
  const cats: Array<[Prisma.CategoryCreateInput['scope'], string, string, string]> = [
    ['WORK', 'photography', 'تصوير', 'Photography'],
    ['WORK', 'visual-arts', 'فنون بصرية', 'Visual arts'],
    ['WORK', 'design', 'تصميم', 'Design'],
    ['WORK', 'film', 'أفلام وتحريك', 'Film & animation'],
    ['ARTICLE', 'essays', 'مقالات', 'Essays'],
    ['ARTICLE', 'stories', 'قصص قصيرة', 'Short stories'],
    ['ARTICLE', 'poetry', 'شعر', 'Poetry'],
    ['ARTICLE', 'texts', 'نصوص', 'Texts'],
    ['ARTICLE', 'interviews', 'حوارات', 'Interviews'],
    ['EVENT', 'sessions', 'جلسات', 'Talks'],
    ['EVENT', 'workshops', 'ورش', 'Workshops'],
    ['EVENT', 'exhibitions', 'معارض', 'Exhibitions'],
    ['EVENT', 'launches', 'إطلاق أعداد', 'Issue launches'],
    ['FIELD', 'photography', 'تصوير', 'Photography'],
    ['FIELD', 'visual-arts', 'فنون بصرية', 'Visual arts'],
    ['FIELD', 'design', 'تصميم', 'Design'],
    ['FIELD', 'film', 'أفلام وتحريك', 'Film & animation'],
    ['FIELD', 'writing', 'كتابة', 'Writing'],
    ['FIELD', 'music', 'موسيقى', 'Music'],
  ];
  const cat: Record<string, string> = {};
  for (const [i, [scope, slug, nameAr, nameEn]] of cats.entries()) {
    const c = await db.category.upsert({
      where: { scope_slug: { scope, slug } },
      create: { scope, slug, nameAr, nameEn, sortOrder: i },
      update: { nameAr, nameEn, sortOrder: i },
    });
    cat[`${scope}:${slug}`] = c.id;
  }

  const tags: Record<string, string> = {};
  for (const [slug, nameAr, nameEn] of [['culture', 'ثقافة', 'Culture'], ['creativity', 'إبداع', 'Creativity'], ['writing', 'كتابة', 'Writing']]) {
    tags[slug] = (await db.tag.upsert({ where: { slug }, create: { slug, nameAr, nameEn }, update: {} })).id;
  }

  if (await db.issue.count({ where: { isDemo: true } })) {
    console.log('البيانات التجريبية موجودة مسبقًا — تم تحديث الأدوار والتصنيفات فقط.');
    return;
  }

  // ───── الوسائط ─────
  const media: Record<string, string> = {};
  for (const [key, [width, height, alt, source]] of Object.entries(IMAGES)) {
    const path = `public/demo/${key}.webp`;
    const a = await db.mediaAsset.create({
      data: {
        kind: 'IMAGE', url: `/demo/${key}.webp`, fileName: `${key}.webp`, mime: 'image/webp',
        size: existsSync(path) ? statSync(path).size : 0, width, height, altAr: alt, altEn: ALT_EN[key],
        source: `قص من ${source} (بيانات عرض تجريبية)`, isDemo: true,
      },
    });
    media[key] = a.id;
  }
  const pdfPath = 'public/demo/issue-13-demo.pdf';
  const pdf = existsSync(pdfPath)
    ? await db.mediaAsset.create({
        data: { kind: 'PDF', url: '/demo/issue-13-demo.pdf', fileName: 'issue-13-demo.pdf', mime: 'application/pdf', size: statSync(pdfPath).size, source: 'ملف PDF تجريبي مولّد للعرض', isDemo: true },
      })
    : null;

  // ───── المبدعون (أسماء من التصاميم، بيانات عرض) ─────
  const creatorDefs: Array<[string, string, string, string[], string, string]> = [
    ['salem-albalushi', 'سالم البلوشي', 'مصوّر', ['photography'], 'Salem Al Balushi', 'Photographer'],
    ['maryam-alharthiya', 'مريم الحارثية', 'فنانة بصرية', ['visual-arts'], 'Maryam Al Harthiya', 'Visual artist'],
    ['khalid-almaamari', 'خالد المعمري', 'مصمم', ['design'], 'Khalid Al Maamari', 'Designer'],
    ['ahmed-alamri', 'أحمد العامري', 'مصوّر وكاتب', ['photography', 'writing'], 'Ahmed Al Amri', 'Photographer and writer'],
    ['yousef-alqasmi', 'يوسف القاسمي', 'صانع أفلام', ['film'], 'Yousef Al Qasmi', 'Filmmaker'],
    ['noura-alsaadiya', 'نورة السعدية', 'فنانة بصرية', ['visual-arts'], 'Noura Al Saadiya', 'Visual artist'],
    ['ali-alrashidi', 'علي الرشيدي', 'مصوّر', ['photography'], 'Ali Al Rashidi', 'Photographer'],
    ['reem-alkindiya', 'ريم الكندية', 'مصممة', ['design'], 'Reem Al Kindiya', 'Designer'],
    ['sara-albalushiya', 'سارة البلوشية', 'تصور ما بين الناس والمكان', ['photography'], 'Sara Al Balushiya', 'Capturing what lies between people and place'],
  ];
  const creator: Record<string, string> = {};
  for (const [slug, name, headline, fields, nameEn, headlineEn] of creatorDefs) {
    const c = await db.creator.create({
      data: {
        slug, displayName: name, displayNameEn: nameEn, headline, headlineEn,
        bio: 'نبذة تجريبية لعرض تصميم ملف المبدع. تُستبدل بالنبذة المعتمدة من صاحب الملف.',
        bioEn: 'Demo bio to show the creator profile layout. To be replaced with the approved bio.',
        quoteEn: slug === 'sara-albalushiya'
          ? 'Through my lens I look for the simple moments that carry a bigger story. Place in Oman always tells us something, and people are the heart of that story.'
          : null,
        fields: { connect: fields.map((f) => ({ id: cat[`FIELD:${f}`] })) },
        approval: 'APPROVED', consentGiven: true, consentAt: new Date(), isDemo: true,
        photoId: slug === 'sara-albalushiya' ? media['spotlight-sara'] : null,
        quote: slug === 'sara-albalushiya'
          ? 'أحاول من خلال عدستي أن أبحث عن اللحظات البسيطة التي تحمل قصة أكبر. فالمكان في عُمان دائمًا يخبرنا شيئًا، والناس هم جوهر هذه القصة.'
          : null,
        searchText: buildSearchText(name, nameEn, headline, headlineEn),
      },
    });
    creator[slug] = c.id;
  }

  // ───── الأعداد ─────
  type IssueDef = { n: number; slug: string; title: string; theme: string; summary: string; themeEn: string; summaryEn: string; date: string; format: 'DIGITAL' | 'PRINT' | 'BOTH'; cover: string };
  const issueDefs: IssueDef[] = [
    { n: 13, slug: 'issue-13', title: 'العدد الثالث عشر', theme: 'مساحات نلتقي فيها', summary: 'في هذا العدد، نبحث في المساحات التي تجمع الناس والأفكار، ونستكشف كيف تصنع الأماكن حكايات جديدة وتفتح آفاقًا لإبداع الشباب في عمان.', themeEn: 'Spaces Where We Meet', summaryEn: 'In this issue we explore the spaces that bring people and ideas together, and how places create new stories and open horizons for young creativity in Oman.', date: '2024-04-01', format: 'BOTH', cover: 'cover-13' },
    { n: 12, slug: 'issue-12', title: 'العدد الثاني عشر', theme: 'ليالٍ من نور', summary: 'رحلة في أضواء المدن والحكايات التي تتولد عند المساء.', themeEn: 'Nights of Light', summaryEn: 'A journey through city lights and the stories that come alive in the evening.', date: '2024-01-01', format: 'DIGITAL', cover: 'cover-12' },
    { n: 11, slug: 'issue-11', title: 'العدد الحادي عشر', theme: 'بين اللون والذاكرة', summary: 'استكشاف للعلاقات بين الفن والهوية والذكريات التي تشكلنا.', themeEn: 'Between Colour and Memory', summaryEn: 'Exploring the links between art, identity and the memories that shape us.', date: '2023-10-01', format: 'BOTH', cover: 'cover-11' },
    { n: 10, slug: 'issue-10', title: 'العدد العاشر', theme: 'حكايات من الأزقة', summary: 'قصص الناس والأماكن في عمان، كما ترويها الذاكرة والوجوه.', themeEn: 'Tales from the Alleys', summaryEn: 'Stories of people and places in Oman, as told by memory and faces.', date: '2023-06-01', format: 'DIGITAL', cover: 'cover-10' },
    { n: 9, slug: 'issue-09', title: 'العدد التاسع', theme: 'بين الجبل والبحر', summary: 'استكشاف لعلاقة الإنسان بالمكان، وما بين الصخر والموج.', themeEn: 'Between Mountain and Sea', summaryEn: 'Exploring our relationship with place, between rock and wave.', date: '2023-03-01', format: 'BOTH', cover: 'cover-09' },
    { n: 8, slug: 'issue-08', title: 'العدد الثامن', theme: 'جيل جديد', summary: 'أصوات شابة تصنع المستقبل بروح التجربة والتجديد.', themeEn: 'A New Generation', summaryEn: 'Young voices shaping the future with a spirit of experiment and renewal.', date: '2023-01-01', format: 'DIGITAL', cover: 'cover-08' },
  ];
  const issue: Record<number, string> = {};
  for (const d of issueDefs) {
    const i = await db.issue.create({
      data: {
        number: d.n, slug: d.slug, title: d.title, theme: d.theme, summary: d.summary,
        titleEn: `Issue ${d.n}`, themeEn: d.themeEn, summaryEn: d.summaryEn,
        coverId: media[d.cover], releaseDate: new Date(d.date + 'T00:00:00Z'), format: d.format,
        language: d.n === 13 ? 'ar,en' : 'ar',
        editionNote: d.n === 13 ? 'إصدار تجريبي' : null,
        promoImageId: d.n === 13 ? media['issues-hero-magazines'] : null,
        pdfId: d.n === 13 ? pdf?.id : null, allowDownload: d.n === 13,
        editorialHtml: d.n === 13
          ? '<p>كلمة تحرير تجريبية لعرض تصميم صفحة العدد. تُستبدل بالكلمة المعتمدة من فريق التحرير.</p><p>نلتقي في هذا العدد حول سؤال المكان: كيف يصنعنا، وكيف نعيد نحن صناعته بالكلمة والصورة.</p>'
          : '',
        status: 'PUBLISHED', publishedAt: new Date(d.date + 'T00:00:00Z'), isDemo: true,
        searchText: buildSearchText(d.title, d.theme, d.summary, `العدد ${d.n}`, String(d.n), d.themeEn, `issue ${d.n}`),
      },
    });
    issue[d.n] = i.id;
  }
  await db.issueContributor.createMany({
    data: [
      { issueId: issue[13], creatorId: creator['ahmed-alamri'], name: 'أحمد العامري', role: 'تصوير', sortOrder: 1 },
      { issueId: issue[13], creatorId: creator['khalid-almaamari'], name: 'خالد المعمري', role: 'تصميم', sortOrder: 2 },
    ],
  });

  // ───── الأعمال (صفحة إبداعات) ─────
  const workDefs: Array<{ slug: string; title: string; titleEn: string; c: string; by: string; img: string; pick?: boolean; extra?: string[]; video?: boolean }> = [
    { slug: 'place-shadows', title: 'ظلال المكان', titleEn: 'Shadows of Place', c: 'photography', by: 'salem-albalushi', img: 'work-place-shadows', extra: ['pick-place-shadows'] },
    { slug: 'memory-features', title: 'ملامح من الذاكرة', titleEn: 'Features of Memory', c: 'visual-arts', by: 'maryam-alharthiya', img: 'work-memory-features' },
    { slug: 'letters-rhythm', title: 'إيقاع الحروف', titleEn: 'Rhythm of Letters', c: 'design', by: 'khalid-almaamari', img: 'work-letters-rhythm' },
    { slug: 'sea-tale', title: 'حكاية بحر', titleEn: 'A Sea Tale', c: 'photography', by: 'ahmed-alamri', img: 'work-sea-tale' },
    { slug: 'behind-the-scene', title: 'خلف المشهد', titleEn: 'Behind the Scene', c: 'film', by: 'yousef-alqasmi', img: 'work-behind-scene', video: true },
    { slug: 'free-spaces', title: 'مساحات حرة', titleEn: 'Free Spaces', c: 'visual-arts', by: 'noura-alsaadiya', img: 'work-free-spaces' },
    { slug: 'light-and-patterns', title: 'ضوء ونقوش', titleEn: 'Light and Patterns', c: 'photography', by: 'ali-alrashidi', img: 'work-light-patterns' },
    { slug: 'growing-details', title: 'تفاصيل تنمو', titleEn: 'Growing Details', c: 'design', by: 'reem-alkindiya', img: 'work-growing-details', pick: true },
  ];
  // ترتيب العرض كما يظهر في صفحة إبداعات المرجعية (من اليمين)
  const displayOrder = ['letters-rhythm', 'memory-features', 'place-shadows', 'free-spaces', 'behind-the-scene', 'sea-tale', 'growing-details', 'light-and-patterns'];
  workDefs.sort((a, b) => displayOrder.indexOf(a.slug) - displayOrder.indexOf(b.slug));
  const work: Record<string, string> = {};
  const base = new Date('2024-05-20T08:00:00Z').getTime();
  for (const [i, d] of workDefs.entries()) {
    const name = creatorDefs.find((c) => c[0] === d.by)![1];
    const w = await db.creativeWork.create({
      data: {
        slug: d.slug, title: d.title, titleEn: d.titleEn, categoryId: cat[`WORK:${d.c}`], thumbnailId: media[d.img],
        description: '<p>وصف تجريبي للعمل لعرض تصميم صفحة العمل. يُستبدل بوصف المبدع المعتمد.</p>',
        descriptionEn: "<p>Demo description to show the work page layout. To be replaced with the creator's approved text.</p>",
        editorsPick: !!d.pick, sortOrder: i, year: 2024, issueId: issue[13], issueOrder: i + 1,
        status: 'PUBLISHED', publishedAt: new Date(base - i * 86_400_000), isDemo: true,
        rights: `© ${name}. جميع الحقوق محفوظة للمبدع.`,
        searchText: buildSearchText(d.title, name, d.titleEn),
        creators: { create: { creatorId: creator[d.by] } },
        media: { create: [d.img, ...(d.extra ?? [])].map((k, j) => ({ assetId: media[k], sortOrder: j })) },
      },
    });
    work[d.slug] = w.id;
  }

  // ───── المقالات ─────
  const body = (intro: string) => `<p>${intro}</p>
<p>هذا نص عرض تجريبي لصفحة القراءة، يوضح طول السطر وارتفاعه ومساحة القراءة المريحة. يُستبدل بالنص المعتمد من الكاتب قبل النشر.</p>
<h2>المكان بوصفه ذاكرة</h2>
<p>تتراكم في الأماكن طبقات من الحكايات؛ جدار قديم، باب خشبي، ظل نخلة على الأرض. كل تفصيل منها يفتح بابًا لسؤال جديد عن الناس الذين مرّوا من هنا.</p>
<blockquote>المكان لا يحفظ الحكاية فقط، بل يعيد روايتها لكل من يصغي إليه.</blockquote>
<h2>جيل يكتب مكانه</h2>
<p>يكتب الجيل الجديد عن مدنه بلغته الخاصة، يمزج الصورة بالكلمة، ويعيد اكتشاف ما ظنّه مألوفًا. وفي هذه الكتابة شيء من الحنين وشيء من الرغبة في التغيير.</p>
<h2>ما بعد الصفحة</h2>
<p>ربما تكون الكتابة طريقة أخرى للبقاء في المكان حتى بعد مغادرته، وطريقة لدعوة الآخرين إليه.</p>`;

  const bodyEn = (intro: string) => `<p>${intro}</p>
<p>This is demo text for the reading page, showing line length, line height and a comfortable reading measure. It will be replaced with the author's approved text before publishing.</p>
<h2>Place as memory</h2>
<p>Places hold layers of stories: an old wall, a wooden door, the shadow of a palm on the ground. Each detail opens a new question about the people who passed through.</p>
<blockquote>A place does not only keep the story; it retells it to anyone who listens.</blockquote>
<h2>A generation writing its place</h2>
<p>The new generation writes about its cities in its own language, mixing image and word and rediscovering what seemed familiar.</p>
<h2>Beyond the page</h2>
<p>Perhaps writing is another way to stay in a place after leaving it, and a way to invite others in.</p>`;

  type ArticleDef = { slug: string; title: string; excerpt: string; titleEn: string; excerptEn: string; c: string; tag?: string; by: string; cover: string; date: string; featured?: boolean; poem?: boolean };
  const articleDefs: ArticleDef[] = [
    { slug: 'oman-new-spaces-for-young-creatives', title: 'كيف تصنع عُمان مساحات جديدة للشباب المبدع؟', excerpt: 'نظرة على المبادرات والمساحات التي تدعم الطاقة الإبداعية في مختلف المحافظات.', titleEn: 'How is Oman creating new spaces for young creatives?', excerptEn: 'A look at the initiatives and spaces supporting creative energy across the governorates.', c: 'essays', tag: 'culture', by: 'ahmed-alamri', cover: 'writing-oman-spaces', date: '2024-05-12' },
    { slug: 'sound-as-identity', title: 'الصوت كهوية: موسيقى الشباب في عُمان', excerpt: 'رحلة في المشهد الموسيقي العُماني الجديد بين التراث والتجريب.', titleEn: 'Sound as identity: youth music in Oman', excerptEn: "A journey through Oman's new music scene, between heritage and experiment.", c: 'essays', tag: 'creativity', by: 'yousef-alqasmi', cover: 'writing-sound-identity', date: '2024-05-05' },
    { slug: 'the-city-as-i-see-it', title: 'المدينة كما أراها', excerpt: 'تأملات بصرية في تفاصيل الحياة اليومية في مسقط.', titleEn: 'The city as I see it', excerptEn: 'Visual reflections on the details of daily life in Muscat.', c: 'texts', tag: 'writing', by: 'ali-alrashidi', cover: 'writing-city-i-see', date: '2024-04-28' },
    { slug: 'places-that-inhabit-us', title: 'الأماكن التي تسكننا', excerpt: 'عن البيوت والسواحل والأزقة التي نحملها معنا أينما ذهبنا.', titleEn: 'The places that live in us', excerptEn: 'On the homes, shores and alleys we carry with us wherever we go.', c: 'essays', by: 'ahmed-alamri', cover: 'work-sea-tale', date: '2024-04-10', featured: true },
    { slug: 'tales-from-old-alleys', title: 'حكايات من الأزقة القديمة', excerpt: 'مشي بطيء في الحارات القديمة، حيث تحكي الجدران ما لا تقوله الكتب.', titleEn: 'Tales from the old alleys', excerptEn: 'A slow walk through old neighbourhoods, where walls tell what books do not.', c: 'essays', tag: 'culture', by: 'ahmed-alamri', cover: 'pick-old-alleys', date: '2024-04-02' },
    { slug: 'a-poem-for-the-sea', title: 'قصيدة للبحر', excerpt: 'نص شعري تجريبي لعرض الحفاظ على فواصل الأسطر.', titleEn: 'A poem for the sea', excerptEn: 'A demo poem showing that line breaks are preserved.', c: 'poetry', by: 'noura-alsaadiya', cover: 'work-free-spaces', date: '2024-03-20', poem: true },
  ];
  const article: Record<string, string> = {};
  for (const d of articleDefs) {
    const name = creatorDefs.find((c) => c[0] === d.by)![1];
    const nameEn = creatorDefs.find((c) => c[0] === d.by)![4];
    const html = d.poem
      ? '<p class="poem">يا بحرُ، خذ من صوتي ما يكفي\nلتعود الموجةُ إلى أولها\nوخذ من الرمل ذاكرةً\nلا تشبه أحدًا سواك</p><p class="poem">(نص تجريبي لعرض الشعر)\nتبقى الأسطر كما كُتبت\nدون أن تُدمج في فقرة واحدة</p>'
      : body(d.excerpt);
    const htmlEn = d.poem
      ? '<p class="poem">O sea, take from my voice what is enough\nfor the wave to return to where it began\nand take from the sand a memory\nthat resembles no one but you</p><p class="poem">(demo poem)\nThe lines stay as they were written\nwithout merging into one paragraph</p>'
      : bodyEn(d.excerptEn);
    // النسخة الإنجليزية مادة مستقلة مرتبطة بالأصل
    const en = await db.article.create({
      data: {
        slug: `${d.slug}-en`, title: d.titleEn, excerpt: d.excerptEn, bodyHtml: htmlEn, lang: 'en', categoryId: cat[`ARTICLE:${d.c}`], coverId: media[d.cover],
        tags: d.tag ? { connect: { id: tags[d.tag] } } : undefined, readingMinutes: readingMinutes(htmlEn),
        status: 'PUBLISHED', publishedAt: new Date(d.date + 'T06:00:00Z'), isDemo: true,
        searchText: buildSearchText(d.titleEn, d.excerptEn, nameEn),
        authors: { create: { creatorId: creator[d.by], role: 'author' } },
      },
    });
    const a = await db.article.create({
      data: {
        slug: d.slug, title: d.title, excerpt: d.excerpt, bodyHtml: html, categoryId: cat[`ARTICLE:${d.c}`], coverId: media[d.cover],
        tags: d.tag ? { connect: { id: tags[d.tag] } } : undefined, featured: !!d.featured, readingMinutes: readingMinutes(html),
        issueId: issue[13], issueOrder: 20, status: 'PUBLISHED', publishedAt: new Date(d.date + 'T06:00:00Z'), isDemo: true,
        sources: d.poem ? null : 'مصدر تجريبي للعرض — يُستبدل بالمصادر الفعلية',
        searchText: buildSearchText(d.title, d.excerpt, name),
        authors: { create: { creatorId: creator[d.by] } },
        translationId: en.id,
      },
    });
    article[d.slug] = a.id;
  }

  // ───── الفعالية ─────
  // التاريخ نسبي (بعد ~5 أسابيع، يوم سبت 17:00–19:00 بتوقيت مسقط) لأن تاريخ التصميم مضى.
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 35);
  while (start.getUTCDay() !== 6) start.setUTCDate(start.getUTCDate() + 1);
  start.setUTCHours(13, 0, 0, 0); // 17:00 مسقط = 13:00 UTC
  const end = new Date(start.getTime() + 2 * 3_600_000);
  await db.event.create({
    data: {
      slug: 'creativity-and-place', title: 'جلسة حوارية: الإبداع والمكان', titleEn: 'Talk: Creativity and Place', categoryId: cat['EVENT:sessions'],
      posterId: media['event-creativity-place'], summary: 'جلسة حوارية تجمع مبدعين شبابًا للحديث عن أثر المكان في أعمالهم.',
      summaryEn: 'A conversation with young creatives on how place shapes their work.', venueEn: 'Oman Across Ages Museum',
      descriptionHtml: '<p>وصف تجريبي للفعالية لعرض تصميم الصفحة. يُستبدل بالتفاصيل المعتمدة.</p>',
      startsAt: start, endsAt: end, venue: 'متحف عُمان عبر الزمان', language: 'العربية', audience: 'الشباب والمهتمون بالإبداع',
      capacity: 40, fee: 'مجاني', registrationEnabled: true, instructions: 'يُرجى الحضور قبل الموعد بربع ساعة.',
      status: 'PUBLISHED', publishedAt: new Date('2024-05-01T00:00:00Z'), isDemo: true,
      searchText: buildSearchText('جلسة حوارية: الإبداع والمكان', 'متحف عمان عبر الزمان'),
      speakers: { create: [{ creatorId: creator['sara-albalushiya'], name: 'سارة البلوشية', title: 'مصوّرة', sortOrder: 1 }] },
    },
  });

  // ───── الرئيسية والإعدادات ─────
  await db.homeFeature.createMany({
    data: [
      { slot: 'PICKS', targetType: 'ARTICLE', targetId: article['tales-from-old-alleys'], sortOrder: 1, isDemo: true },
      { slot: 'PICKS', targetType: 'WORK', targetId: work['memory-features'], imageOverrideId: media['pick-color-memory'], sortOrder: 2, isDemo: true },
      { slot: 'PICKS', targetType: 'WORK', targetId: work['place-shadows'], imageOverrideId: media['pick-place-shadows'], sortOrder: 3, isDemo: true },
      { slot: 'SPOTLIGHT', targetType: 'CREATOR', targetId: creator['sara-albalushiya'], sortOrder: 1, isDemo: true },
    ],
  });

  await db.siteSettings.upsert({
    where: { id: 1 },
    create: { id: 1 },
    update: {},
  });
  await db.siteSettings.update({
    where: { id: 1 },
    data: {
      // كما في التصميم المرجعي: «لجيلِ» بكسرة
      heroTitle: 'مساحة\nلجيلِ',
      footerTaglineEn: 'Alfeen — youth and creativity magazine in Oman',
      heroIssueId: issue[13],
      homeHeroImageId: media['home-hero-magazines'],
      heroTitleEn: 'A space for a generation that',
      heroHighlightEn: 'creates',
      heroTextEn: 'Young voices, stories told,\nand creativity worth being seen.',
      tickerWords: ['فنون', 'كتابة', 'تصوير', 'ثقافة', 'إبداع'],
      tickerWordsEn: ['Arts', 'Writing', 'Photography', 'Culture', 'Creativity'],
      aboutStory: 'نص مبدئي: ألفين منصة مجلة شبابية عُمانية تجمع الإبداع والفنون والكتابة والثقافة في مساحة واحدة. (يُستبدل بالقصة المعتمدة)',
      aboutVision: 'نص مبدئي: مساحة لجيلٍ يبدع.',
      aboutMission: 'نص مبدئي: أصوات شابة، حكايات تُروى، وإبداع يستحق أن يُرى.',
      aboutFields: ['فنون', 'كتابة', 'تصوير', 'ثقافة', 'إبداع'],
    },
  });

  console.log('تمت إضافة بيانات العرض التجريبية.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
