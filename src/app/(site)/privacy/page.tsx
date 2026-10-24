import type { Metadata } from 'next';
import { getT } from '@/lib/i18n/server';
import { LegalPage } from '@/components/site/LegalPage';

export const metadata: Metadata = { title: 'الخصوصية' };

export default async function PrivacyPage() {
  const { lang, t } = await getT();
  const ar = [
    { h: 'ما الذي تجمعه المنصة', p: [
      'التصفح العام لا يتطلب حسابًا. تُجمع البيانات فقط عندما تستخدم نموذجًا: النشرة البريدية (البريد الإلكتروني ولغة الواجهة)، التواصل (الاسم والبريد ونوع الاستفسار والرسالة)، تسجيل الفعاليات (الاسم والبريد)، والمشاركات (البيانات والملفات التي ترسلها).',
      'لا تُخزَّن عناوين IP كما هي؛ تُستخدم نسخة مجزّأة منها لفترة قصيرة لمنع الإساءة وتحديد معدل الطلبات.',
    ] },
    { h: 'ملفات تعريف الارتباط', p: [
      'تستخدم المنصة ملف ارتباط واحدًا لحفظ لغة الواجهة، وملف جلسة لفريق الإدارة فقط عند تسجيل الدخول. لا تُستخدم ملفات تتبع أو إعلانات.',
    ] },
    { h: 'من يطّلع على بياناتك', p: [
      'المشاركات وملفاتها محفوظة في تخزين خاص لا يصل إليه إلا أعضاء الفريق المصرّح لهم، ولا تُنشر إلا بعد القبول والاعتماد.',
      'بريد المبدعين وبيانات الموافقات وملاحظات الفريق لا تظهر في الصفحات العامة.',
    ] },
    { h: 'حقوقك', p: [
      'يمكنك إلغاء الاشتراك في النشرة من الرابط الموجود في كل رسالة، وإلغاء تسجيل الفعاليات من رابط إدارة التسجيل. لطلب حذف بياناتك تواصل مع الفريق عبر صفحة «تواصل معنا».',
    ] },
  ];
  const en = [
    { h: 'What the platform collects', p: [
      'Browsing needs no account. Data is collected only when you use a form: newsletter (email and interface language), contact (name, email, enquiry type, message), event registration (name, email) and submissions (the details and files you send).',
      'IP addresses are not stored as-is; a hashed form is used briefly to prevent abuse and rate-limit requests.',
    ] },
    { h: 'Cookies', p: ['One cookie remembers your interface language, and a session cookie is used only by the admin team when signed in. No tracking or advertising cookies.'] },
    { h: 'Who sees your data', p: [
      'Submissions and their files are kept in private storage accessible only to authorised team members, and are published only after acceptance.',
      "Creators' emails, consent records and team notes never appear on public pages.",
    ] },
    { h: 'Your rights', p: ['Unsubscribe via the link in every newsletter, cancel event registrations from your registration link, and contact the team to request deletion of your data.'] },
  ];
  return <LegalPage title={t('footer.privacy')} crumb={t('footer.privacy')} lang={lang} sections={lang === 'en' ? en : ar} />;
}
