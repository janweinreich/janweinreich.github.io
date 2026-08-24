import type { Metadata } from "next";
import Link from "next/link";
import { PageFrame } from "./components/page-frame";
import { PostList } from "./components/post-list";
import { SITE_DESCRIPTION, TOPICS } from "@/content/site-config";
import { publishedPosts } from "@/content/posts";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <PageFrame>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title" aria-label={SITE_DESCRIPTION}>
            <span>
              Notes on <em>AI,</em>
            </span>
            <span>physics, and</span>
            <span>other things.</span>
          </h1>
        </div>

        <div className="topic-rail" aria-label="Topics">
          <ol>
            {TOPICS.map((topic, index) => (
              <li key={topic}>
                <span aria-hidden="true">0{index + 1}</span>
                <span>{topic}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="writing-preview" aria-labelledby="writing-title">
        <div className="section-heading">
          <span className="section-number" aria-hidden="true">
            01
          </span>
          <h2 id="writing-title">Writing</h2>
          <Link className="section-link" href="/writing" aria-label="Writing">
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <PostList posts={publishedPosts.slice(0, 4)} />
      </section>
    </PageFrame>
  );
}
