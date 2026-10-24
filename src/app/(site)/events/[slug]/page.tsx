import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT, pick } from '@/lib/i18n/server';
import { getEvent } from '@/lib/queries/content';
import { EventView } from '@/components/views/EventView';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getT();
  const e = await getEvent(decodeURIComponent(slug));
  if (!e) return {};
  const title = pick(lang, e.title, e.titleEn).text;
  const description = pick(lang, e.summary, e.summaryEn).text;
  return { title, description, openGraph: { title, description, images: e.poster ? [e.poster.url] : undefined } };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const { lang, dir } = await getT();
  const event = await getEvent(decodeURIComponent(slug));
  if (!event) notFound();
  return <EventView event={event} lang={lang} dir={dir} />;
}
