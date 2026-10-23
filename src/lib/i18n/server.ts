import 'server-only';
import { cookies } from 'next/headers';
import { translate, type DictKey, type Lang } from './dict';

export const LANG_COOKIE = 'alfeen_lang';

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === 'en' ? 'en' : 'ar';
}

export async function getT() {
  const lang = await getLang();
  return { lang, t: (key: DictKey) => translate(lang, key), dir: lang === 'ar' ? ('rtl' as const) : ('ltr' as const) };
}

/**
 * يختار النص المترجم إن وُجد، وإلا يعيد العربية مع وسم اللغة الصحيح
 * حتى لا نوهم القارئ بوجود ترجمة غير موجودة.
 */
export function pick(lang: Lang, ar: string, en?: string | null): { text: string; lang: Lang } {
  if (lang === 'en' && en) return { text: en, lang: 'en' };
  return { text: ar, lang: 'ar' };
}
