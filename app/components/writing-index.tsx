"use client";

import { useState } from "react";
import type { PostImage } from "@/content/posts";
import styles from "../home.module.css";

type IndexPost = {
  slug: string;
  title: string;
  summary: string;
  published: string;
  tags: string[];
  source?: string;
  subject: string;
  image?: PostImage;
};

type Subject = { id: string; label: string; count: number };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 19 19 5M5 5h14v14" />
    </svg>
  );
}

export function WritingIndex({ posts, subjects }: { posts: IndexPost[]; subjects: Subject[] }) {
  const [subject, setSubject] = useState("all");
  const visible = subject === "all" ? posts : posts.filter((post) => post.subject === subject);
  const featuredSlug = posts[0]?.slug;

  return (
    <section className={styles.writing} id="writing" aria-labelledby="writing-title">
      <header className={styles.writingHeading}>
        <div className={styles.sectionTitle}>
          <h2 id="writing-title">Writing</h2>
          <span className={styles.articleCount} role="status">{visible.length} articles</span>
        </div>
        <a className={styles.archiveLink} href="/writing/">All writing <span aria-hidden="true">↗</span></a>
      </header>

      <div className={styles.filters} role="group" aria-label="Filter writing by subject">
        {[{ id: "all", label: "Everything", count: posts.length }, ...subjects].map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={subject === item.id}
            aria-controls="home-articles"
            onClick={() => setSubject(item.id)}
          >
            {item.label}<span>{String(item.count).padStart(2, "0")}</span>
          </button>
        ))}
      </div>

      <ol className={styles.articles} id="home-articles">
        {visible.map((post) => {
          const featured = post.slug === featuredSlug;

          return (
            <li className={featured ? styles.featuredEntry : styles.entry} key={post.slug}>
              <article className={featured ? styles.featured : undefined}>
                <a className={styles.articleLink} href={`/writing/${post.slug}/`}>
                  <div className={styles.articleCopy}>
                    <div className={styles.articleMeta}>
                      <span className={styles.topic} data-subject={post.subject}>
                        {featured ? "Latest article" : subjects.find((item) => item.id === post.subject)?.label}
                      </span>
                      <time dateTime={post.published}>{formatDate(post.published)}</time>
                    </div>
                    <h3>{post.title}</h3>
                    <p className={styles.summary}>{post.summary}</p>
                  </div>
                  {featured && post.image && (
                    <div className={styles.coverVisual} aria-hidden="true">
                      <img
                        src={post.image.src}
                        alt=""
                        width={post.image.width}
                        height={post.image.height}
                        srcSet={post.image.srcSet}
                        sizes="(max-width: 800px) calc(100vw - 40px), (max-width: 960px) calc(100vw - 340px), (max-width: 1104px) calc(100vw - 400px), 704px"
                        fetchPriority="high"
                        decoding="async"
                      />
                    </div>
                  )}
                  <div className={styles.articleFoot}>
                    <span>{post.source ? `Republished from ${post.source}` : post.tags.join(" / ")}</span>
                    <span className={styles.readLink}>Read article <Arrow /></span>
                  </div>
                </a>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
