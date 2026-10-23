import 'server-only';
import sanitizeHtml from 'sanitize-html';

/** تعقيم محتوى المحرر قبل الحفظ. يسمح بالبنية التحريرية فقط. */
export function sanitizeRich(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'a', 'hr', 'figure', 'figcaption', 'img', 'code', 'pre'],
    allowedAttributes: {
      a: ['href', 'title', 'rel', 'target'],
      img: ['src', 'alt', 'width', 'height'],
      p: ['class', 'dir'],
      blockquote: ['class'],
      h2: ['id'],
      h3: ['id'],
    },
    allowedClasses: { p: ['poem', 'verse'], blockquote: ['pull'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: 'noopener noreferrer', ...(attribs.href?.startsWith('http') ? { target: '_blank' } : {}) },
      }),
      img: (tagName, attribs) => {
        // الصور المحلية فقط (من مكتبة الوسائط) أو https
        const src = attribs.src ?? '';
        return { tagName, attribs: src.startsWith('/') || src.startsWith('https://') ? attribs : { ...attribs, src: '' } };
      },
    },
  });
}

/** نص عادي: يُزال أي وسم. */
export function plain(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** يضيف معرّفات للعناوين لبناء فهرس المقال، ويعيد قائمة العناوين. */
export function withHeadingIds(html: string): { html: string; headings: Array<{ id: string; text: string; level: number }> } {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  let i = 0;
  const out = html.replace(/<h([23])(?:\s[^>]*)?>([\s\S]*?)<\/h\1>/g, (_m, level: string, inner: string) => {
    const id = `section-${++i}`;
    headings.push({ id, text: inner.replace(/<[^>]*>/g, '').trim(), level: Number(level) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  return { html: out, headings };
}
