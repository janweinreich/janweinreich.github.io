import type { PostRecord } from "@/content/posts";

export const SHELVES = [
  {
    id: "biology",
    label: "Biology",
    line: "Proteins, viruses, and the places a drug might bind.",
  },
  {
    id: "chemistry",
    label: "Chemistry",
    line: "Molecules, models, and the ChemBricks writing.",
  },
  {
    id: "physics",
    label: "Physics",
    line: "Mechanics, written so the equations can be read side by side.",
  },
  {
    id: "elsewhere",
    label: "Elsewhere",
    line: "Art, values, and the notes from outside the lab.",
  },
] as const;

const SUBJECTS = ["Biology", "Chemistry", "Physics"] as const;

export function shelfId(tags: readonly string[]) {
  return SUBJECTS.find((name) => tags.includes(name))?.toLowerCase() ?? "elsewhere";
}

export function groupPosts(posts: readonly PostRecord[]) {
  const grouped = new Map(SHELVES.map((shelf) => [shelf.id, [] as PostRecord[]]));
  for (const post of posts) {
    grouped.get(shelfId(post.metadata.tags))?.push(post);
  }
  return SHELVES.flatMap((shelf) => {
    const items = grouped.get(shelf.id) ?? [];
    return items.length ? [{ ...shelf, posts: items }] : [];
  });
}
