import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageFrame } from "@/app/components/page-frame";
import { getPost, publishedPosts } from "@/content/posts";

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return publishedPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    return {};
  }

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    alternates: {
      canonical: `/writing/${post.slug}`,
    },
    openGraph: {
      type: "article",
      title: post.metadata.title,
      description: post.metadata.summary,
      publishedTime: post.metadata.published,
      modifiedTime: post.metadata.updated,
      tags: [...post.metadata.tags],
      url: `/writing/${post.slug}`,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) {
    notFound();
  }

  const Article = post.Content;

  return (
    <PageFrame>
      <article className="article-shell">
        <Link className="article-back" href="/writing">
          <span aria-hidden="true">←</span>
          Writing
        </Link>

        <header className="article-header">
          <h1>{post.metadata.title}</h1>
          <p className="article-deck">{post.metadata.summary}</p>
          <div className="article-meta">
            <time dateTime={post.metadata.published}>
              {post.metadata.published}
            </time>
            {post.metadata.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </header>

        <div className="article-body">
          <Article />
        </div>
      </article>
    </PageFrame>
  );
}
