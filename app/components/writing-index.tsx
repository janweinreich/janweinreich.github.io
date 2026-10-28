"use client";

import { useState } from "react";
import styles from "../home.module.css";

type IndexPost = {
  slug: string;
  title: string;
  summary: string;
  published: string;
  tags: string[];
  source?: string;
  subject: string;
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
  const featuredSlug = posts[0]?.slug === "ten-angstroms-of-a-cysteine" ? posts[0].slug : undefined;
  const hasFeature = visible.some((post) => post.slug === featuredSlug);

  return (
    <section className={styles.writing} id="writing" aria-labelledby="writing-title">
      <header className={styles.writingHeading}>
        <div className={styles.sectionTitle}>
          <span className={styles.sectionNumber} aria-hidden="true">01 /</span>
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

      <ol className={styles.articles} id="home-articles" data-has-feature={hasFeature}>
        {visible.map((post) => {
          const featured = post.slug === featuredSlug;

          return (
            <li className={featured ? styles.featuredEntry : styles.entry} key={post.slug}>
              <article className={featured ? styles.featured : styles.article}>
                <a className={styles.articleLink} href={`/writing/${post.slug}/`}>
                  <div className={styles.articleCopy}>
                    <div className={styles.articleMeta}>
                      <span className={styles.topic} data-subject={post.subject}>
                        <span aria-hidden="true" />
                        {featured ? "Latest article" : subjects.find((item) => item.id === post.subject)?.label}
                      </span>
                      <time dateTime={post.published}>{formatDate(post.published)}</time>
                    </div>
                    <h3>{post.title}</h3>
                    <p className={styles.summary}>{post.summary}</p>
                    <div className={styles.articleFoot}>
                      <span>{post.source ? `Republished from ${post.source}` : post.tags.join(" / ")}</span>
                      <span className={styles.readLink}>Read article <Arrow /></span>
                    </div>
                  </div>
                  {featured && (
                    <div className={styles.featureVisual} aria-hidden="true">
                      <span className={styles.measure}>10<span>Å</span></span>
                      <span className={styles.measureRing} />
                      <img src="/writing/cysteine-pocket/dashboard.png" alt="" width={1280} height={800} decoding="async" />
                      <span className={styles.visualLabel}>Cysteine pocket explorer</span>
                    </div>
                  )}
                </a>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
