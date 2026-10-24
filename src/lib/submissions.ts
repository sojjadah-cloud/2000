// قواعد المشاركات المشتركة بين النموذج (العميل) والخادم.

export const SUBMISSION_TYPES = [
  { value: 'writing', ar: 'كتابة (مقال، قصة، شعر، نص)', en: 'Writing (essay, story, poem, text)' },
  { value: 'photography', ar: 'تصوير', en: 'Photography' },
  { value: 'visual-arts', ar: 'فنون بصرية', en: 'Visual arts' },
  { value: 'design', ar: 'تصميم', en: 'Design' },
  { value: 'film', ar: 'أفلام وتحريك', en: 'Film & animation' },
  { value: 'music', ar: 'موسيقى وصوت', en: 'Music & sound' },
  { value: 'other', ar: 'أخرى', en: 'Other' },
] as const;

export type SubmissionType = (typeof SUBMISSION_TYPES)[number]['value'];

/** حدود الرفع المعروضة للمستخدم قبل الرفع، ونفسها تُفرض على الخادم. */
export const SUBMISSION_LIMITS = {
  maxFiles: 5,
  maxTotalMB: 60,
  groups: [
    { key: 'image', ar: 'صور: JPG، PNG، WEBP، GIF', en: 'Images: JPG, PNG, WEBP, GIF', maxMB: 15 },
    { key: 'document', ar: 'نصوص: PDF أو DOCX', en: 'Documents: PDF or DOCX', maxMB: 25 },
    { key: 'audio', ar: 'صوت: MP3، M4A، WAV', en: 'Audio: MP3, M4A, WAV', maxMB: 30 },
    { key: 'video', ar: 'فيديو قصير: MP4 أو WEBM (للأطول استخدم رابطًا خاصًا)', en: 'Short video: MP4 or WEBM (use a private link for longer)', maxMB: 50 },
  ],
} as const;

export const ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,.gif,.pdf,.docx,.mp3,.m4a,.wav,.mp4,.webm';

/** رقم طلب مقروء: ALF-2026-4F7K2 */
export function submissionCode(year: number, random: string) {
  return `ALF-${year}-${random.toUpperCase()}`;
}
