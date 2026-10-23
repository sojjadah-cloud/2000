// أيقونات بسيطة للمنصات (lucide لم يعد يوفر شعارات العلامات التجارية).
export function SocialIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p === 'instagram')
    return (
      <svg aria-hidden viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  if (p === 'linkedin')
    return (
      <svg aria-hidden viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2.2 7.3V18h2.6v-7.7H6.2Zm1.3-4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm3.4 4V18h2.5v-4c0-1.1.2-2.1 1.5-2.1s1.4 1.2 1.4 2.2V18h2.6v-4.4c0-2.3-.5-4-3.1-4-1.3 0-2.1.7-2.5 1.3v-.6h-2.4Z" />
      </svg>
    );
  if (p === 'x' || p === 'twitter')
    return (
      <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.2-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
      </svg>
    );
  if (p === 'youtube')
    return (
      <svg aria-hidden viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
        <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8ZM10 15V9l5.2 3L10 15Z" />
      </svg>
    );
  return (
    <svg aria-hidden viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
