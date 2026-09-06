import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the approved identity and navigation", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Jans Blog<\/title>/i);
  assert.match(html, /Notes on/);
  assert.match(html, /physics, and/);
  assert.match(html, /other things\./);
  assert.match(html, /href="\/writing"/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="https:\/\/github\.com\/janweinreich"/);
  assert.match(html, /One Structure, Three Languages/);
  assert.doesNotMatch(html, /Your site is taking shape|Starter Project/);
});

test("renders the first article, writing index, and empty about page", async () => {
  const [
    writingResponse,
    articleResponse,
    valuesResponse,
    fragmentsResponse,
    aboutResponse,
  ] = await Promise.all([
    render("/writing"),
    render("/writing/one-structure-three-languages"),
    render("/writing/values-as-social-dna"),
    render("/writing/believing-longing-choosing"),
    render("/about"),
  ]);

  assert.equal(writingResponse.status, 200);
  assert.equal(articleResponse.status, 200);
  assert.equal(valuesResponse.status, 200);
  assert.equal(fragmentsResponse.status, 200);
  assert.equal(aboutResponse.status, 200);
  assert.match(await writingResponse.text(), /One Structure, Three Languages/);
  assert.match(await articleResponse.text(), /The Hamiltonian generates motion/);
  assert.match(await valuesResponse.text(), /I am not a philosopher/);
  assert.match(await fragmentsResponse.text(), /Believing in the value/);
  assert.match(await aboutResponse.text(), /<h1[^>]*>\s*About\s*<\/h1>/i);
});

test("builds static discovery files", async () => {
  const [sitemap, robots, manifest] = await Promise.all([
    readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8"),
    readFile(new URL("../dist/client/robots.txt", import.meta.url), "utf8"),
    readFile(
      new URL("../dist/client/manifest.webmanifest", import.meta.url),
      "utf8",
    ),
  ]);

  assert.match(sitemap, /https:\/\/janweinreich\.github\.io\/writing/);
  assert.match(
    sitemap,
    /https:\/\/janweinreich\.github\.io\/writing\/one-structure-three-languages/,
  );
  assert.match(
    sitemap,
    /https:\/\/janweinreich\.github\.io\/writing\/values-as-social-dna/,
  );
  assert.match(
    sitemap,
    /https:\/\/janweinreich\.github\.io\/writing\/believing-longing-choosing/,
  );
  assert.match(robots, /Sitemap: https:\/\/janweinreich\.github\.io\/sitemap\.xml/);
  assert.equal(JSON.parse(manifest).name, "Jans Blog");
});

test("removes disposable starter code", async () => {
  const packageJson = await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(packageJson, /react-loading-skeleton|drizzle/);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});

test("uses document navigation compatible with static hosting", async () => {
  const routeFiles = [
    "app/page.tsx",
    "app/not-found.tsx",
    "app/components/post-list.tsx",
    "app/components/site-footer.tsx",
    "app/components/site-header.tsx",
    "app/writing/[slug]/page.tsx",
  ];

  const sources = await Promise.all(
    routeFiles.map((path) => readFile(new URL(`../${path}`, import.meta.url), "utf8")),
  );

  for (const source of sources) {
    assert.doesNotMatch(source, /next\/link/);
  }
});
