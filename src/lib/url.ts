// بناء روابط القوائم مع الحفاظ على معاملات البحث الحالية.

export type Params = Record<string, string | undefined>;

export function hrefWith(path: string, current: Params, changes: Params): string {
  const merged: Params = { ...current, ...changes };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(merged)) if (v) qs.set(k, v);
  const s = qs.toString();
  return s ? `${path}?${s}` : path;
}

/** يحوّل searchParams (قد تكون مصفوفات) إلى قيم نصية مفردة. */
export function flatParams(sp: Record<string, string | string[] | undefined>): Params {
  const out: Params = {};
  for (const [k, v] of Object.entries(sp)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

export function pageNumber(v: string | undefined, max = 50): number {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? Math.min(n, max) : 1;
}
