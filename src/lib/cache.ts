import 'server-only';

// ذاكرة مؤقتة داخل العملية لاستعلامات المحتوى العام المنشور.
// - تحفظ القيمة كما هي (تبقى كائنات Date سليمة، بخلاف التخزين المسلسل)
// - تشارك الطلبات المتزامنة الوعد نفسه فلا يتكرر الاستعلام
// - مدة قصيرة (60 ثانية) فيظهر المحتوى المجدول والتعديلات سريعًا
// - invalidateContent() تُفرغها فورًا (تستدعيها لوحة الإدارة عند الحفظ)

type Entry = { value: Promise<unknown>; expires: number };

const TTL_MS = 60_000;
const MAX_ENTRIES = 500;
const store = new Map<string, Entry>();

export function cached<A extends unknown[], R>(name: string, fn: (...args: A) => Promise<R>, ttl = TTL_MS) {
  return (...args: A): Promise<R> => {
    const key = `${name}:${JSON.stringify(args)}`;
    const now = Date.now();
    const hit = store.get(key);
    if (hit && hit.expires > now) return hit.value as Promise<R>;
    const value = fn(...args).catch((e) => {
      store.delete(key); // لا نخزّن الأخطاء
      throw e;
    });
    store.set(key, { value, expires: now + ttl });
    if (store.size > MAX_ENTRIES) {
      // حذف الأقدم إدراجًا
      const oldest = store.keys().next().value;
      if (oldest) store.delete(oldest);
    }
    return value;
  };
}

export function invalidateContent() {
  store.clear();
}
