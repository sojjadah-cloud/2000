import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT, pick } from '@/lib/i18n/server';
import { getWork, relatedWorks } from '@/lib/queries/content';
import { stripHtml, truncate } from '@/lib/text';
import { WorkView } from '@/components/views/WorkView';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getT();
  const work = await getWork(decodeURIComponent(slug));
  if (!work) return {};
  const title = pick(lang, work.title, work.titleEn).text;
  const description = truncate(stripHtml(pick(lang, work.description, work.descriptionEn).text), 160);
  return { title, description, openGraph: { title, description, images: work.thumbnail ? [work.thumbnail.url] : undefined } };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const { lang, dir } = await getT();
  const work = await getWork(decodeURIComponent(slug));
  if (!work) notFound();
  const related = await relatedWorks(work);
  return <WorkView work={work} related={related} lang={lang} dir={dir} />;
}
