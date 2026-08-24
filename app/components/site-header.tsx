import Link from "next/link";

const navigation = [
  { label: "Writing", href: "/writing" },
  { label: "About", href: "/about" },
  {
    label: "GitHub",
    href: "https://github.com/janweinreich",
    external: true,
  },
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Link className="wordmark" href="/" aria-label="Jan, home">
        <span>Jan</span>
        <span className="wordmark-dot" aria-hidden="true" />
      </Link>

      <nav className="site-nav" aria-label="Primary navigation">
        <ul>
          {navigation.map((item) => (
            <li key={item.label}>
              {"external" in item ? (
                <a href={item.href} target="_blank" rel="noreferrer">
                  {item.label}
                  <span className="external-mark" aria-hidden="true">
                    ↗
                  </span>
                </a>
              ) : (
                <Link href={item.href}>{item.label}</Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
