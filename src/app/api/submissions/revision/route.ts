import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { hashToken } from '@/lib/tokens';
import { deleteStored, inspectUpload, saveFile, UploadError } from '@/lib/storage';
import { notifyTeam, emailLayout, escapeHtml } from '@/lib/email';
import { plain } from '@/lib/sanitize';
import { SUBMISSION_LIMITS } from '@/lib/submissions';

const MB = 1024 * 1024;
const GROUP_MAX: Record<string, number> = { image: 15, pdf: 25, document: 25, audio: 30, video: 50 };

/** نسخة معدّلة من المشارك: تُقبل فقط إذا كانت الحالة «مطلوب تعديل»، مع حفظ النسخ السابقة. */
export async function POST(req: Request) {
  if (!(await rateLimit('submission-revision', 10, 3600))) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const token = String(form.get('token') ?? '');
  const note = plain(String(form.get('note') ?? '')).slice(0, 3000);
  const link = String(form.get('privateLink') ?? '').trim();
  const privateLink = /^https?:\/\/\S{3,500}$/.test(link) ? link : undefined;

  const sub = await db.submission.findUnique({ where: { trackingTokenHash: hashToken(token) }, include: { revisions: { select: { number: true } } } });
  if (!sub) return NextResponse.json({ ok: false, error: 'notfound' }, { status: 404 });
  if (sub.status !== 'NEEDS_CHANGES') return NextResponse.json({ ok: false, error: 'state' }, { status: 409 });

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > SUBMISSION_LIMITS.maxFiles || files.reduce((s, f) => s + f.size, 0) > SUBMISSION_LIMITS.maxTotalMB * MB) {
    return NextResponse.json({ ok: false, error: 'tooLarge' }, { status: 422 });
  }
  if (!files.length && !privateLink && !note) return NextResponse.json({ ok: false, error: 'empty' }, { status: 422 });

  const saved: Array<{ key: string; name: string; mime: string; size: number }> = [];
  try {
    for (const f of files) {
      const { buffer, mime } = await inspectUpload(f, ['image', 'pdf', 'document', 'audio', 'video']);
      const group = mime.startsWith('image/') ? 'image' : mime === 'application/pdf' ? 'pdf' : mime.startsWith('audio/') ? 'audio' : mime.startsWith('video/') ? 'video' : 'document';
      if (buffer.length > GROUP_MAX[group] * MB) throw new UploadError(`${f.name}: ${GROUP_MAX[group]}MB`);
      saved.push({ key: await saveFile(buffer, mime, 'private', 'submissions'), name: plain(f.name).slice(0, 200), mime, size: buffer.length });
    }
  } catch (e) {
    for (const s of saved) await deleteStored('private', s.key);
    if (e instanceof UploadError) return NextResponse.json({ ok: false, error: 'file', detail: e.message }, { status: 422 });
    throw e;
  }

  const number = Math.max(0, ...sub.revisions.map((r) => r.number)) + 1;
  await db.$transaction([
    db.submissionRevision.create({
      data: { submissionId: sub.id, number, note: note || null, privateLink, files: { create: saved.map((s) => ({ storageKey: s.key, originalName: s.name, mime: s.mime, size: s.size })) } },
    }),
    db.submission.update({ where: { id: sub.id }, data: { status: 'IN_REVIEW' } }),
    db.submissionStatusLog.create({ data: { submissionId: sub.id, fromStatus: 'NEEDS_CHANGES', toStatus: 'IN_REVIEW', actor: 'submitter', note: `نسخة معدّلة رقم ${number}` } }),
  ]);
  await notifyTeam(`نسخة معدّلة ${sub.code}`, emailLayout('نسخة معدّلة', `<p>${escapeHtml(sub.title)} — نسخة ${number}</p>`), 'submission-revision');
  return NextResponse.json({ ok: true, number });
}
