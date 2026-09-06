import type { Metadata } from "next";
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
      <div className="home-stage">
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

        <section
          className="writing-preview home-writing"
          aria-labelledby="writing-title"
        >
          <div className="section-heading">
            <span className="section-number" aria-hidden="true">
              01
            </span>
            <h2 id="writing-title">Latest writing</h2>
            <a
              className="section-link"
              href="/writing"
              aria-label="View all writing"
            >
              All <span aria-hidden="true">→</span>
            </a>
          </div>
          <PostList posts={publishedPosts.slice(0, 3)} />
        </section>
      </div>
    </PageFrame>
  );
}
