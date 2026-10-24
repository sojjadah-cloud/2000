import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { appUrl, hashToken, randomToken } from '@/lib/tokens';
import { inspectUpload, saveFile, deleteStored, UploadError } from '@/lib/storage';
import { emailLayout, escapeHtml, notifyTeam, sendEmail } from '@/lib/email';
import { plain } from '@/lib/sanitize';
import { SUBMISSION_LIMITS, SUBMISSION_TYPES, submissionCode } from '@/lib/submissions';

const MB = 1024 * 1024;
const opt = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));
const bool = z.union([z.literal('on'), z.literal('true'), z.literal('1')]).optional().transform((v) => !!v);

const schema = z
  .object({
    type: z.enum(SUBMISSION_TYPES.map((t) => t.value) as [string, ...string[]]),
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().email().max(254),
    bio: opt(1500),
    field: opt(120),
    title: z.string().trim().min(2).max(200),
    description: z.string().trim().min(20).max(5000),
    language: z.enum(['ar', 'en', 'ar,en', 'other']),
    collaborators: opt(1000),
    privateLink: z.string().trim().url().max(500).optional().or(z.literal('').transform(() => undefined)),
    previouslyPublished: bool,
    publishedWhere: opt(500),
    rightsStatement: z.string().trim().min(10).max(2000),
    isMinor: bool,
    guardianName: opt(120),
    guardianEmail: z.string().trim().toLowerCase().email().max(254).optional().or(z.literal('').transform(() => undefined)),
    guardianConsent: bool,
    termsAccepted: bool,
  })
  .superRefine((d, ctx) => {
    if (!d.termsAccepted) ctx.addIssue({ code: 'custom', path: ['termsAccepted'], message: 'terms' });
    if (d.previouslyPublished && !d.publishedWhere) ctx.addIssue({ code: 'custom', path: ['publishedWhere'], message: 'where' });
    if (d.isMinor && (!d.guardianName || !d.guardianEmail || !d.guardianConsent)) ctx.addIssue({ code: 'custom', path: ['guardianConsent'], message: 'guardian' });
  });

const GROUP_MAX: Record<string, number> = { image: 15, pdf: 25, document: 25, audio: 30, video: 50 };

export async function POST(req: Request) {
  if (!(await rateLimit('submission', 5, 3600))) {
    return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  // فخ البرامج الآلية
  if (form.get('website')) return NextResponse.json({ ok: true, code: 'ALF-0000-00000', trackUrl: null, emailed: false });

  const raw = Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === 'string')) as Record<string, string>;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'validation', fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] }, { status: 422 });
  }
  const d = parsed.data;

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > SUBMISSION_LIMITS.maxFiles) return NextResponse.json({ ok: false, error: 'tooManyFiles' }, { status: 422 });
  if (files.reduce((s, f) => s + f.size, 0) > SUBMISSION_LIMITS.maxTotalMB * MB) return NextResponse.json({ ok: false, error: 'tooLarge' }, { status: 422 });
  if (files.length === 0 && !d.privateLink) return NextResponse.json({ ok: false, error: 'validation', fields: ['files'] }, { status: 422 });

  // فحص النوع الحقيقي من المحتوى، ثم الحفظ في التخزين الخاص (لا يُخدم للعامة)
  const saved: Array<{ key: string; name: string; mime: string; size: number }> = [];
  try {
    for (const f of files) {
      const { buffer, mime } = await inspectUpload(f, ['image', 'pdf', 'document', 'audio', 'video']);
      const group = mime.startsWith('image/') ? 'image' : mime === 'application/pdf' ? 'pdf' : mime.startsWith('audio/') ? 'audio' : mime.startsWith('video/') ? 'video' : 'document';
      if (buffer.length > GROUP_MAX[group] * MB) throw new UploadError(`${f.name}: ${GROUP_MAX[group]}MB`);
      const key = await saveFile(buffer, mime, 'private', 'submissions');
      saved.push({ key, name: plain(f.name).slice(0, 200), mime, size: buffer.length });
    }
  } catch (e) {
    for (const s of saved) await deleteStored('private', s.key);
    if (e instanceof UploadError) return NextResponse.json({ ok: false, error: 'file', detail: e.message }, { status: 422 });
    throw e;
  }

  const token = randomToken();
  const year = new Date().getUTCFullYear();
  let code = '';
  for (let i = 0; i < 5; i++) {
    code = submissionCode(year, randomBytes(4).toString('base64url').replace(/[-_]/g, 'X').slice(0, 5));
    if (!(await db.submission.findUnique({ where: { code } }))) break;
  }

  try {
    await db.submission.create({
      data: {
        code, type: d.type, name: plain(d.name), email: d.email, bio: d.bio && plain(d.bio), field: d.field && plain(d.field),
        title: plain(d.title), description: plain(d.description), language: d.language, collaborators: d.collaborators && plain(d.collaborators),
        previouslyPublished: d.previouslyPublished, publishedWhere: d.publishedWhere && plain(d.publishedWhere), rightsStatement: plain(d.rightsStatement),
        isMinor: d.isMinor, guardianName: d.guardianName && plain(d.guardianName), guardianEmail: d.guardianEmail, guardianConsent: d.guardianConsent,
        termsAccepted: d.termsAccepted, trackingTokenHash: hashToken(token),
        revisions: { create: { number: 1, privateLink: d.privateLink, files: { create: saved.map((s) => ({ storageKey: s.key, originalName: s.name, mime: s.mime, size: s.size })) } } },
        history: { create: { toStatus: 'RECEIVED', actor: 'submitter', note: null } },
      },
    });
  } catch (e) {
    for (const s of saved) await deleteStored('private', s.key);
    throw e;
  }

  const trackUrl = appUrl(`/submit/track/${token}`);
  const emailed = await sendEmail({
    to: d.email,
    purpose: 'submission-received',
    subject: `استلمنا مشاركتك ${code}`,
    html: emailLayout(
      'تم استلام مشاركتك',
      `<p>${escapeHtml(d.name)}، شكرًا لمشاركتك «${escapeHtml(d.title)}».</p><p>رقم الطلب: <b dir="ltr">${code}</b></p>
       <p>تابع حالة طلبك عبر هذا الرابط الخاص (لا تشاركه): <a href="${trackUrl}">متابعة المشاركة</a></p>`,
    ),
  });
  await notifyTeam(`مشاركة جديدة ${code}`, emailLayout('مشاركة جديدة', `<p>${escapeHtml(d.title)} — ${escapeHtml(d.type)}</p>`), 'submission-notify');

  return NextResponse.json({ ok: true, code, trackUrl, emailed });
}
