/// <reference types="vite/client" />

import type { ComponentType } from "react";

export type PostMetadata = {
  title: string;
  summary: string;
  published: string;
  updated?: string;
  tags: readonly string[];
  draft?: boolean;
};

type PostModule = {
  default: ComponentType;
  metadata: PostMetadata;
};

export type PostRecord = {
  slug: string;
  metadata: PostMetadata;
  Content: ComponentType;
};

const modules = import.meta.glob<PostModule>("./posts/*.mdx", {
  eager: true,
});

function slugFromPath(path: string) {
  return path.split("/").at(-1)?.replace(/\.mdx$/, "") ?? "";
}

function validateMetadata(path: string, metadata: PostMetadata | undefined) {
  if (!metadata) {
    throw new Error(`${path} must export metadata.`);
  }

  const requiredText = [metadata.title, metadata.summary, metadata.published];
  if (requiredText.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${path} has incomplete metadata.`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.published)) {
    throw new Error(`${path} must use YYYY-MM-DD for published.`);
  }

  if (!Array.isArray(metadata.tags)) {
    throw new Error(`${path} metadata.tags must be an array.`);
  }
}

export const allPosts: PostRecord[] = Object.entries(modules)
  .map(([path, module]) => {
    validateMetadata(path, module.metadata);

    return {
      slug: slugFromPath(path),
      metadata: module.metadata,
      Content: module.default,
    };
  })
  .sort((left, right) =>
    right.metadata.published.localeCompare(left.metadata.published),
  );

export const publishedPosts = allPosts.filter((post) => !post.metadata.draft);

export function getPost(slug: string) {
  return publishedPosts.find((post) => post.slug === slug);
}
