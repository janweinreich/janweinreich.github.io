"use client";

import { useState } from "react";

export type MindMapBranch = {
  id: string;
  label: string;
  line: string;
  posts: readonly { slug: string; title: string; published: string }[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function MindMap({ branches }: { branches: readonly MindMapBranch[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="mindmap-wrap">
      <div className="mindmap">
        <svg className="mindmap-wires" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path className={open === "biology" ? "is-live" : undefined} d="M44 46 C 34 32, 26 20, 20 13" />
          <path className={open === "chemistry" ? "is-live" : undefined} d="M56 46 C 66 32, 74 20, 80 13" />
          <path className={open === "physics" ? "is-live" : undefined} d="M44 54 C 34 68, 26 80, 20 87" />
          <path className={open === "elsewhere" ? "is-live" : undefined} d="M56 54 C 66 68, 74 80, 80 87" />
        </svg>

        <p className="mindmap-center">Notes</p>

        {branches.map((group) => (
          <div className={`mindmap-node is-${group.id}`} key={group.id}>
            <button
              type="button"
              aria-expanded={open === group.id}
              aria-controls={`${group.id}-leaves`}
              className={open === group.id ? "is-open" : undefined}
              onClick={() => setOpen((current) => (current === group.id ? null : group.id))}
            >
              <span>{group.label}</span>
              <span className="mindmap-count">{String(group.posts.length).padStart(2, "0")}</span>
            </button>
          </div>
        ))}
      </div>

      {branches.map((group) => (
        <div
          className="mindmap-tray"
          id={`${group.id}-leaves`}
          key={group.id}
          hidden={open !== group.id}
        >
          <p>{group.line}</p>
          <ul>
            {group.posts.map((post) => (
              <li key={post.slug}>
                <a href={`/writing/${post.slug}/`}>
                  <span>{post.title}</span>
                  <time dateTime={post.published}>{formatDate(post.published)}</time>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
