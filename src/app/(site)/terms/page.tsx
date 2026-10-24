import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'شروط المشاركة والنشر' };

export default async function TermsPage() {
  const { lang } = await getT();
  const ar = [
    { h: 'إرسال المشاركة', p: [
      'ترسل مشاركتك عبر النموذج دون إنشاء حساب، وتحصل على رقم طلب ورابط متابعة خاص. إرسال المشاركة لا يعني قبولها أو نشرها.',
      'تمر كل مشاركة بمراحل: تم الاستلام، قيد المراجعة، وقد يُطلب منك تعديل، ثم القبول أو الاعتذار، ثم النشر عند القبول.',
    ] },
    { h: 'الحقوق', p: [
      'تقرّ عند الإرسال بأن العمل من إنتاجك أو أن لديك حق نشره، وتذكر المتعاونين وحقوق أي مواد مستخدمة فيه.',
      'تُحدَّد شروط استخدام العمل المقبول (مدة النشر، النسخ المطبوعة والرقمية، ذكر الاسم) مع المشارك قبل النشر — [يحتاج تحديدًا من إدارة المجلة].',
    ] },
    { h: 'المشاركون دون 18 عامًا', p: [
      'تُطلب بيانات ولي الأمر وموافقته قبل مراجعة المشاركة. [سياسة المجلة التفصيلية للقاصرين تحتاج إلى اعتماد].',
    ] },
    { h: 'المحتوى غير المقبول', p: ['تحتفظ المجلة بحق الاعتذار عن أي مشاركة لا تناسب طبيعتها التحريرية. [معايير القبول التفصيلية تحتاج إلى اعتماد].'] },
  ];
  const en = [
    { h: 'Submitting', p: [
      'You submit through the form without an account and receive a reference and private tracking link. Submitting does not mean acceptance or publication.',
      'Each submission moves through: received, in review, possibly changes requested, then accepted or declined, then published if accepted.',
    ] },
    { h: 'Rights', p: [
      'By submitting you confirm the work is yours or that you have the right to publish it, and you credit collaborators and any third-party material.',
      'Terms of use for accepted work (duration, print and digital, credit) are agreed with the contributor before publication — [to be defined by the magazine].',
    ] },
    { h: 'Contributors under 18', p: ["A parent or guardian's details and consent are required before review. [Detailed policy for minors needs approval]."] },
    { h: 'Unsuitable content', p: ['The magazine may decline submissions that do not fit its editorial nature. [Detailed acceptance criteria need approval].'] },
  ];
  const title = lang === 'en' ? 'Participation and publishing terms' : 'شروط المشاركة والنشر';
  return <LegalPage title={title} crumb={title} lang={lang} sections={lang === 'en' ? en : ar} />;
}
