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
      <a className="wordmark" href="/" aria-label="Jans Blog, home">
        <span>Jans Blog</span>
        <span className="wordmark-dot" aria-hidden="true" />
      </a>

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
                <a href={item.href}>{item.label}</a>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
