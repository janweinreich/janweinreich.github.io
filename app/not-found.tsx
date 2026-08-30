import { PageFrame } from "./components/page-frame";

export default function NotFound() {
  return (
    <PageFrame>
      <section className="not-found">
        <h1>Not found</h1>
        <a href="/">Home</a>
      </section>
    </PageFrame>
  );
}
