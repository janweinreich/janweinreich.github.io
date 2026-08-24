import type { Metadata } from "next";
import { PageFrame } from "../components/page-frame";

export const metadata: Metadata = {
  title: "About",
  alternates: {
    canonical: "/about",
  },
};

export const dynamic = "force-static";

export default function AboutPage() {
  return (
    <PageFrame>
      <section className="page-content" aria-labelledby="about-page-title">
        <header className="page-intro">
          <span className="section-number" aria-hidden="true">
            02
          </span>
          <h1 className="page-title" id="about-page-title">
            About
          </h1>
        </header>
        <div className="about-space" aria-hidden="true" />
      </section>
    </PageFrame>
  );
}
