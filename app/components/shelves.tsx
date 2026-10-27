import { groupPosts } from "@/content/shelves";
import type { PostRecord } from "@/content/posts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function Shelves({ posts }: { posts: readonly PostRecord[] }) {
  const groups = groupPosts(posts);

  return (
    <div className="shelves">
      <nav className="shelf-index" aria-label="Writing by subject">
        {groups.map((group) => (
          <a href={`#${group.id}`} key={group.id}>
            <span>{group.label}</span>
            <span className="shelf-count">{String(group.posts.length).padStart(2, "0")}</span>
          </a>
        ))}
      </nav>

      {groups.map((group) => (
        <section className="shelf" id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
          <header className="shelf-head">
            <h2 id={`${group.id}-title`}>{group.label}</h2>
            <p>{group.line}</p>
          </header>
          <ol className="shelf-list">
            {group.posts.map((post) => (
              <li key={post.slug}>
                <a className="shelf-link" href={`/writing/${post.slug}/`}>
                  <span className="shelf-row">
                    <span className="shelf-title">{post.metadata.title}</span>
                    <time dateTime={post.metadata.published}>{formatDate(post.metadata.published)}</time>
                  </span>
                  <span className="shelf-summary">{post.metadata.summary}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
