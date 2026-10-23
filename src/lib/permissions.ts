// مصفوفة الصلاحيات. تُفرض على الخادم في كل عملية عبر requirePermission.

export const PERMISSIONS = [
  'dashboard.view',
  'issues.manage',
  'works.manage',
  'articles.manage',
  'content.publish',
  'creators.manage',
  'creators.private', // رؤية البيانات الخاصة للمبدعين
  'events.manage',
  'registrations.view',
  'submissions.review',
  'submissions.files',
  'messages.manage',
  'newsletter.manage',
  'media.manage',
  'home.manage',
  'about.manage',
  'taxonomy.manage',
  'settings.manage',
  'users.manage',
  'audit.view',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const DEFAULT_ROLES: Array<{ key: string; nameAr: string; nameEn: string; permissions: Permission[] }> = [
  { key: 'admin', nameAr: 'مدير', nameEn: 'Administrator', permissions: [...PERMISSIONS] },
  {
    key: 'editor',
    nameAr: 'محرر',
    nameEn: 'Editor',
    permissions: [
      'dashboard.view', 'issues.manage', 'works.manage', 'articles.manage', 'content.publish', 'creators.manage',
      'creators.private', 'submissions.review', 'submissions.files', 'newsletter.manage', 'media.manage', 'home.manage',
      'about.manage', 'taxonomy.manage', 'messages.manage',
    ],
  },
  {
    key: 'reviewer',
    nameAr: 'مراجع',
    nameEn: 'Reviewer',
    permissions: ['dashboard.view', 'submissions.review', 'submissions.files'],
  },
  {
    key: 'events',
    nameAr: 'مسؤول فعاليات',
    nameEn: 'Events manager',
    permissions: ['dashboard.view', 'events.manage', 'registrations.view', 'media.manage'],
  },
];
