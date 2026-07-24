import { promises as fs } from 'fs';
import path from 'path';
import type { Article } from './blogFormat';

export type { Article, ArticleIllustration } from './blogFormat';
export { formatReadTime, formatUpdated } from './blogFormat';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

/**
 * Loads every article from src/content/blog/*.json. This is the single
 * source of truth for blog content — adding or editing a post means
 * adding/editing a JSON file here, no component changes required.
 *
 * Server-only (uses Node's fs) — import from Server Components / route
 * handlers, never from a 'use client' file.
 */
export async function getAllArticles(): Promise<Article[]> {
  const files = await fs.readdir(CONTENT_DIR);
  const jsonFiles = files.filter((file) => file.endsWith('.json'));

  const results = await Promise.allSettled(
    jsonFiles.map(async (file) => {
      const raw = await fs.readFile(path.join(CONTENT_DIR, file), 'utf-8');
      return JSON.parse(raw) as Article;
    }),
  );

  const articles: Article[] = [];
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      articles.push(result.value);
    } else {
      console.error(`[blog] Failed to load ${jsonFiles[i]}:`, result.reason);
    }
  });

  return articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const articles = await getAllArticles();
  return articles.find((article) => article.slug === slug);
}

export async function getFeaturedGuide(): Promise<Article | undefined> {
  const articles = await getAllArticles();
  return articles.find((article) => article.featuredGuide) ?? articles[0];
}
