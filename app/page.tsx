import type { Metadata } from "next";
import { PageFrame } from "./components/page-frame";
import { AttractorCover } from "./components/attractor-cover";
import { WritingIndex } from "./components/writing-index";
import { FunProjects } from "./components/fun-projects";
import { SITE_DESCRIPTION } from "@/content/site-config";
import { groupPosts, shelfId } from "@/content/shelves";
import { publishedPosts } from "@/content/posts";
import styles from "./home.module.css";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  const groups = groupPosts(publishedPosts);
  const posts = publishedPosts.map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    summary: post.metadata.summary,
    published: post.metadata.published,
    tags: [...post.metadata.tags],
    source: post.metadata.source?.name,
    subject: shelfId(post.metadata.tags),
  }));

  return (
    <PageFrame className={styles.frame}>
      <div className={styles.home}>
        <section className={styles.intro} aria-labelledby="home-title">
          <div className={styles.introCopy}>
            <h1 id="home-title" aria-label={SITE_DESCRIPTION}>
              <span className={styles.titleLead}>Notes on</span>{" "}
              <span className={styles.titleLine}>biology, chemistry,</span>{" "}
              <span className={styles.titleLine}>physics, and</span>{" "}
              <em>other things.</em>
            </h1>
            <div className={styles.introActions}>
              <a className={styles.exploreLink} href="#writing">
                Explore the writing <span aria-hidden="true">↓</span>
              </a>
              <a className={`${styles.exploreLink} ${styles.projectJump}`} href="#fun-projects">
                Fun projects <span aria-hidden="true">↘</span>
              </a>
            </div>
          </div>
          <AttractorCover />
        </section>

        <WritingIndex
          posts={posts}
          subjects={groups.map(({ id, label, posts: items }) => ({ id, label, count: items.length }))}
        />

        <FunProjects />

        <section className={styles.company} aria-labelledby="company-writing-title">
          <div>
            <span className={styles.sectionNumber} aria-hidden="true">03 /</span>
            <h2 id="company-writing-title">Writing for<br />ChemBricks</h2>
          </div>
          <div className={styles.companyCopy}>
            <p>
              I write the <a href="https://chembricks.ai/blog/">ChemBricks blog</a>,
              covering our work on AI for chemistry, molecular models, benchmarking,
              and physics-based validation. Those articles are republished here with
              their original dates and links to the originals.
            </p>
            <a className={styles.companyLink} href="https://chembricks.ai/blog/">
              ChemBricks blog <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
      </div>
    </PageFrame>
  );
}
