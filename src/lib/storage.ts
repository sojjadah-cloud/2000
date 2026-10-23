import 'server-only';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join, normalize, resolve, sep } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileTypeFromBuffer } from 'file-type';

// خدمة التخزين: قرص محلي بمجلدين معزولين.
//  public/  وسائط منشورة تُخدم عبر /media/...
//  private/ ملفات المشاركات، لا تُخدم إلا عبر مسارات الإدارة بعد التحقق من الصلاحية.
// لاستبدالها بتخزين سحابي (S3 وما شابه) يكفي تغيير هذا الملف.

const ROOT = resolve(process.env.STORAGE_DIR || './storage');

export type Visibility = 'public' | 'private';

export const LIMITS = {
  image: { mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], maxBytes: 15 * 1024 * 1024 },
  pdf: { mimes: ['application/pdf'], maxBytes: 80 * 1024 * 1024 },
  video: { mimes: ['video/mp4', 'video/webm', 'video/quicktime'], maxBytes: 200 * 1024 * 1024 },
  audio: { mimes: ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/wav', 'audio/ogg'], maxBytes: 50 * 1024 * 1024 },
  document: {
    mimes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip'],
    maxBytes: 15 * 1024 * 1024,
  },
} as const;

export type LimitGroup = keyof typeof LIMITS;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif',
  'application/pdf': 'pdf', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov',
  'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx', 'application/zip': 'zip',
};

export class UploadError extends Error {}

/** يتحقق من نوع الملف من محتواه الفعلي (لا من الامتداد) ومن حجمه. */
export async function inspectUpload(file: File, groups: LimitGroup[]): Promise<{ buffer: Buffer; mime: string }> {
  if (file.size === 0) throw new UploadError('الملف فارغ');
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  // docx يُكتشف كـ zip أحيانًا؛ نقبله فقط إذا كان الامتداد docx
  let mime = detected?.mime as string | undefined;
  if (mime === 'application/zip' && file.name.toLowerCase().endsWith('.docx')) {
    mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  const group = groups.find((g) => mime && (LIMITS[g].mimes as readonly string[]).includes(mime));
  if (!mime || !group) throw new UploadError(`نوع الملف غير مسموح: ${file.name}`);
  if (buffer.length > LIMITS[group].maxBytes) {
    throw new UploadError(`حجم الملف ${file.name} أكبر من الحد المسموح (${Math.round(LIMITS[group].maxBytes / 1048576)} م.ب)`);
  }
  return { buffer, mime };
}

export async function saveFile(buffer: Buffer, mime: string, visibility: Visibility, folder: string): Promise<string> {
  const now = new Date();
  const key = [folder, String(now.getUTCFullYear()), randomBytes(16).toString('hex') + '.' + (EXT[mime] ?? 'bin')].join('/');
  const full = pathFor(visibility, key);
  await mkdir(resolve(full, '..'), { recursive: true });
  await writeFile(full, buffer, { flag: 'wx' });
  return key;
}

export async function readStored(visibility: Visibility, key: string): Promise<Buffer | null> {
  try {
    return await readFile(pathFor(visibility, key));
  } catch {
    return null;
  }
}

export async function storedSize(visibility: Visibility, key: string): Promise<number | null> {
  try {
    return (await stat(pathFor(visibility, key))).size;
  } catch {
    return null;
  }
}

export async function deleteStored(visibility: Visibility, key: string) {
  await unlink(pathFor(visibility, key)).catch(() => {});
}

/** يمنع الخروج من مجلد التخزين عبر ../ */
function pathFor(visibility: Visibility, key: string): string {
  const base = join(ROOT, visibility);
  const full = resolve(base, normalize(key));
  if (!full.startsWith(base + sep)) throw new UploadError('مسار غير صالح');
  return full;
}

export function mimeForKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  return Object.entries(EXT).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
}

export function mediaKindFor(mime: string): 'IMAGE' | 'PDF' | 'VIDEO' | 'AUDIO' | 'OTHER' {
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('audio/')) return 'AUDIO';
  return 'OTHER';
}
