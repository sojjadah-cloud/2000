import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT, pick } from '@/lib/i18n/server';
import { getIssue, relatedIssues } from '@/lib/queries/content';
import { IssueView } from '@/components/views/IssueView';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await getT();
  const issue = await getIssue(decodeURIComponent(slug));
  if (!issue) return {};
  const title = issue.ogTitle || `${pick(lang, issue.title, issue.titleEn).text} — ${pick(lang, issue.theme, issue.themeEn).text}`;
  const description = issue.ogDescription || pick(lang, issue.summary, issue.summaryEn).text;
  return { title, description, openGraph: { title, description, images: issue.cover ? [issue.cover.url] : undefined, type: 'article' } };
}

export default async function IssuePage({ params }: Props) {
  const { slug } = await params;
  const { lang } = await getT();
  const issue = await getIssue(decodeURIComponent(slug));
  if (!issue) notFound();
  const related = await relatedIssues(issue.id);
  return <IssueView issue={issue} related={related} lang={lang} />;
}
