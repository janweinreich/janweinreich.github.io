import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <Link href="#top" aria-label="Back to top">
        ↑
      </Link>
    </footer>
  );
}
