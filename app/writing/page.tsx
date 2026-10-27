import type { Metadata } from "next";
import { PageFrame } from "../components/page-frame";
import { Shelves } from "../components/shelves";
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
          <h1 className="page-title" id="writing-page-title">
            Writing
          </h1>
        </header>
        <Shelves posts={publishedPosts} />
      </section>
    </PageFrame>
  );
}
