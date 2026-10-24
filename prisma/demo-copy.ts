// نصوص المحتوى الأولي المشتركة بين seed.ts وpatch-copy.ts.

export const WORK_COPY: Record<string, { ar: string; en: string }> = {
  'place-shadows': {
    ar: 'زقاق طيني ضيق يقود العين نحو برج قديم، والضوء يرسم على الجدران إيقاع المكان وهدوءه.',
    en: 'A narrow mud-brick alley leads the eye toward an old tower, with light tracing the rhythm and calm of the place.',
  },
  'memory-features': {
    ar: 'بورتريه بألوان متداخلة لوجه امرأة بوشاح مزخرف، تلتقي فيه الذاكرة باللون.',
    en: 'A portrait of a woman in a patterned scarf, where memory meets layered colour.',
  },
  'letters-rhythm': {
    ar: 'تكوين حروفي لشعار ألفين بالبرتقالي والكحلي، يحوّل الحرف العربي إلى حركة.',
    en: 'A lettering composition of the Alfeen logo in orange and navy, turning Arabic letters into movement.',
  },
  'sea-tale': {
    ar: 'قلعة على صخور الساحل لحظة الغروب، بين ضوء دافئ وموج أزرق.',
    en: 'A fort on coastal rocks at sunset, between warm light and blue waves.',
  },
  'behind-the-scene': {
    ar: 'لحظة من كواليس التصوير: صانع أفلام شاب خلف الكاميرا قبل أن يبدأ المشهد.',
    en: 'A behind-the-scenes moment: a young filmmaker behind the camera before the scene begins.',
  },
  'free-spaces': {
    ar: 'لوحة تجريدية بضربات فرشاة كثيفة بالأزرق والبرتقالي، مساحة مفتوحة للتأمل.',
    en: 'An abstract painting in dense blue and orange strokes — an open space for reflection.',
  },
  'light-and-patterns': {
    ar: 'جدران بيضاء وأقواس متتالية تتسلل إليها ظلال السعف في منتصف النهار.',
    en: 'White walls and repeating arches touched by palm shadows at midday.',
  },
  'growing-details': {
    ar: 'رسم نباتي دقيق لأغصان وأزهار بيضاء، يحتفي بالتفاصيل الصغيرة وهي تنمو.',
    en: 'A detailed botanical drawing of branches and white flowers, celebrating small details as they grow.',
  },
};

export const ISSUE13_EDITORIAL = '<p>نلتقي في هذا العدد حول سؤال المكان: كيف يصنعنا، وكيف نعيد نحن صناعته بالكلمة والصورة.</p>';

export const POEM_AR =
  '<p class="poem">يا بحرُ، خذ من صوتي ما يكفي\nلتعود الموجةُ إلى أولها\nوخذ من الرمل ذاكرةً\nلا تشبه أحدًا سواك</p><p class="poem">وأعود إليك كلما ضاق المدى\nأحمل ملحك في القلب\nوأترك على الشاطئ\nخطى لا يمحوها الموج</p>';
export const POEM_EN =
  '<p class="poem">O sea, take from my voice what is enough\nfor the wave to return to where it began\nand take from the sand a memory\nthat resembles no one but you</p><p class="poem">and I return to you whenever the horizon narrows\ncarrying your salt in my heart\nleaving on the shore\nsteps the waves cannot erase</p>';
export const POEM_EXCERPT = { ar: 'قصيدة عن البحر والذاكرة والعودة.', en: 'A poem about the sea, memory and return.' };

export const ABOUT = {
  story: 'ألفين منصة مجلة شبابية عُمانية تجمع الإبداع والفنون والكتابة والثقافة في مساحة واحدة.',
  vision: 'مساحة لجيلٍ يبدع.',
  mission: 'أصوات شابة، حكايات تُروى، وإبداع يستحق أن يُرى.',
};

// الفقرة التي كانت تشرح أن النص للعرض فقط (تُحذف من أجسام المقالات)
export const OLD_ARTICLE_NOTE_AR = /<p>هذا نص عرض تجريبي[^<]*<\/p>\s*/;
export const OLD_ARTICLE_NOTE_EN = /<p>This is demo text for the reading page[^<]*<\/p>\s*/;
