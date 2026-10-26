import type { Metadata } from "next";
import { PageFrame } from "./components/page-frame";
import { PostList } from "./components/post-list";
import { Attractor } from "./components/attractor";
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
      <div className="journal">
        <header className="journal-intro">
          <p className="journal-topics">{TOPICS.join(" / ")}</p>
          <h1 aria-label={SITE_DESCRIPTION}>
            Notes on <em>AI,</em> physics, and other things.
          </h1>
        </header>

        <section className="journal-writing" aria-labelledby="writing-title">
          <div className="section-heading">
            <h2 id="writing-title">Latest writing</h2>
            <a
              className="section-link"
              href="/writing/"
              aria-label="View all writing"
            >
              All writing <span aria-hidden="true">↗</span>
            </a>
          </div>
          <PostList posts={publishedPosts.slice(0, 5)} />
        </section>

        <section className="company-writing" aria-labelledby="company-writing-title">
          <h2 id="company-writing-title">Writing for ChemBricks</h2>
          <p>
            I write the <a href="https://chembricks.ai/blog/">ChemBricks blog</a>,
            covering our work on AI for chemistry, molecular models, benchmarking,
            and physics-based validation. Those articles are republished here with
            their original dates and links to the originals.
          </p>
        </section>
        <div className="journal-signature"><Attractor /></div>
      </div>
    </PageFrame>
  );
}
