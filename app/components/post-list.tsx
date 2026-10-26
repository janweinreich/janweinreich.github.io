import type { PostRecord } from "@/content/posts";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function PostList({ posts }: { posts: PostRecord[] }) {
  if (posts.length === 0) {
    return (
      <div className="empty-row">
        <span className="empty-index" aria-hidden="true">
          00
        </span>
        <p>No posts yet.</p>
      </div>
    );
  }

  return (
    <ol className="post-list">
      {posts.map((post) => (
        <li className="post-entry" key={post.slug}>
          <a className="post-link" href={`/writing/${post.slug}`}>
            <div className="post-meta">
              <span className="post-topics">
                {post.metadata.tags.map((tag) => (
                  <span className="post-topic" key={tag}>{tag}</span>
                ))}
              </span>
              <time className="post-date" dateTime={post.metadata.published}>
                {formatDate(post.metadata.published)}
              </time>
            </div>
            {post.metadata.source ? (
              <span className="post-source">Republished from {post.metadata.source.name}</span>
            ) : null}
            <h3 className="post-title">{post.metadata.title}</h3>
            <p className="post-summary">{post.metadata.summary}</p>
            <span className="post-read">
              Read article <span aria-hidden="true">↗</span>
            </span>
          </a>
        </li>
      ))}
    </ol>
  );
}
