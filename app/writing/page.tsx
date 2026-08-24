import type { Metadata } from "next";
import { PageFrame } from "../components/page-frame";
import { PostList } from "../components/post-list";
import { publishedPosts } from "@/content/posts";

export const metadata: Metadata = {
  title: "Writing",
  alternates: {
    canonical: "/writing",
  },
};

export const dynamic = "force-static";

export default function WritingPage() {
  return (
    <PageFrame>
      <section className="page-content" aria-labelledby="writing-page-title">
        <header className="page-intro">
          <span className="section-number" aria-hidden="true">
            01
          </span>
          <h1 className="page-title" id="writing-page-title">
            Writing
          </h1>
        </header>
        <PostList posts={publishedPosts} />
      </section>
    </PageFrame>
  );
}
