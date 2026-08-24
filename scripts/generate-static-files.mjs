import { readdir, readFile, writeFile } from "node:fs/promises";
import matter from "gray-matter";

const postsDirectory = new URL("../content/posts/", import.meta.url);
const publicDirectory = new URL("../public/", import.meta.url);
const siteConfigFile = new URL("../content/site-config.json", import.meta.url);

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function assertMetadata(file, metadata) {
  const requiredText = [metadata.title, metadata.summary, metadata.published];

  if (requiredText.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${file} has incomplete frontmatter.`);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.published)) {
    throw new Error(`${file} must use YYYY-MM-DD for published.`);
  }

  if (!Array.isArray(metadata.tags)) {
    throw new Error(`${file} frontmatter tags must be an array.`);
  }
}

const site = JSON.parse(await readFile(siteConfigFile, "utf8"));
const entries = await readdir(postsDirectory, { withFileTypes: true });
const posts = [];

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".mdx")) continue;

  const source = await readFile(new URL(entry.name, postsDirectory), "utf8");
  const { data } = matter(source);
  assertMetadata(entry.name, data);

  if (!data.draft) {
    posts.push({
      slug: entry.name.replace(/\.mdx$/, ""),
      metadata: data,
    });
  }
}

posts.sort((left, right) =>
  right.metadata.published.localeCompare(left.metadata.published),
);

const sitemapUrls = [
  `${site.url}/`,
  `${site.url}/writing`,
  `${site.url}/about`,
  ...posts.map((post) => `${site.url}/writing/${post.slug}`),
];
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapUrls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
  "</urlset>",
  "",
].join("\n");

const robots = [
  "User-agent: *",
  "Allow: /",
  `Sitemap: ${site.url}/sitemap.xml`,
  "",
].join("\n");

const manifest = `${JSON.stringify(
  {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#f2efe7",
    theme_color: "#3159e8",
    icons: [
      {
        src: "/favicon.png",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  },
  null,
  2,
)}\n`;

await Promise.all([
  writeFile(new URL("sitemap.xml", publicDirectory), sitemap, "utf8"),
  writeFile(new URL("robots.txt", publicDirectory), robots, "utf8"),
  writeFile(
    new URL("manifest.webmanifest", publicDirectory),
    manifest,
    "utf8",
  ),
]);
