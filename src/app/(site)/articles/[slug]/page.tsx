import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getT } from '@/lib/i18n/server';
import { getArticle, relatedArticles } from '@/lib/queries/content';
import { ArticleView } from '@/components/views/ArticleView';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getArticle(decodeURIComponent(slug));
  if (!a) return {};
  const title = a.seoTitle || a.title;
  const description = a.seoDescription || a.excerpt;
  const alternates = a.translation ? { languages: { [a.translation.lang]: `/articles/${a.translation.slug}` } } : undefined;
  return { title, description, alternates, openGraph: { title, description, type: 'article', images: a.cover ? [a.cover.url] : undefined, publishedTime: a.publishedAt?.toISOString() } };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { lang } = await getT();
  const article = await getArticle(decodeURIComponent(slug));
  if (!article) notFound();
  // المقالات المرتبطة تُحسب من المادة الأصلية حتى للنسخة المترجمة
  const original = article.translationOf ?? article;
  const related = await relatedArticles({ id: original.id, categoryId: original.categoryId, excludeId: article.id });
  return <ArticleView article={article} related={related} lang={lang} />;
}
