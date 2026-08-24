import Link from "next/link";
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
      {posts.map((post, index) => (
        <li className="post-row" key={post.slug}>
          <span className="empty-index" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          <Link href={`/writing/${post.slug}`}>
            <div>
              <h3 className="post-title">{post.metadata.title}</h3>
              <p className="post-summary">{post.metadata.summary}</p>
            </div>
            <time className="post-date" dateTime={post.metadata.published}>
              {formatDate(post.metadata.published)}
            </time>
          </Link>
        </li>
      ))}
    </ol>
  );
}
