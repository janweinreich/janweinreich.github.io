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

test("republishes all six ChemBricks articles with their original dates and canonical links", async () => {
  const dates = {
    "six-architectures-learning-curve": "2026-09-07",
    "after-ebolathon-bdbv-gp-screen": "2026-08-08",
    "audited-agentic-discovery-engine": "2026-07-25",
    "benchmarking-cmbx-models": "2026-07-22",
    "physics-gated-molecular-design": "2026-07-20",
    "whats-new-in-the-virtual-lab": "2026-07-16",
  };
  const sitemap = await readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8");

  for (const [sourceSlug, published] of Object.entries(dates)) {
    const slug = `chembricks-${sourceSlug}`;
    const metadata = JSON.parse(await readFile(new URL(`../content/republications/${slug}.json`, import.meta.url), "utf8"));
    assert.equal(metadata.published, published);
    assert.equal(metadata.source.url, `https://chembricks.ai/blog/${sourceSlug}/`);

    const response = await render(`/writing/${slug}`);
    assert.equal(response.status, 200, slug);
    const html = await response.text();
    assert.match(html, /I wrote this article for/);
    assert.match(html, /aria-label="Republication"/);
    assert.match(html, /class="republication-body"><(?:figure|p)\b/);
    const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(([tag]) => tag).find(tag => tag.includes('rel="canonical"'));
    assert.ok(canonical?.includes(`href="${metadata.source.url}"`), slug);
    assert.ok(html.includes(published), slug);
    assert.ok(sitemap.includes(`/writing/${slug}`), slug);

    if (sourceSlug === "after-ebolathon-bdbv-gp-screen") {
      assert.equal(metadata.updated, "2026-08-20");
      assert.match(html, /data-molecular-viewer="bdbv"/);
      assert.match(html, /data-viewer-compound/);
      assert.match(html, /data-viewer-toggle="pocket"/);
      assert.match(html, /data-viewer-toggle="closeup"/);
      assert.match(html, /data-viewer-toggle="spin"/);
      assert.match(html, /data-smiles=/);
    }
  }
});

test("includes complete imported bodies and local figure assets without source scripts", async () => {
  const manifest = JSON.parse(await readFile(new URL("../content/republications/sources/chembricks.json", import.meta.url), "utf8"));
  assert.equal(manifest.articles.length, 6);

  for (const article of manifest.articles) {
    const html = await readFile(new URL(`../content/republications/${article.slug}.html`, import.meta.url), "utf8");
    assert.doesNotMatch(html, /<(script|iframe|form)\b|\son[a-z]+\s*=/i);
    assert.ok((html.match(/<p[\s>]/g) ?? []).length >= article.paragraphs);
    assert.equal((html.match(/<h[2-6][\s>]/g) ?? []).length, article.headings);
    assert.equal((html.match(/<table[\s>]/g) ?? []).length, article.tables);
    assert.equal((html.match(/<figcaption[\s>]/g) ?? []).length, article.figures);
  }

  for (const asset of manifest.assets) {
    const contents = await readFile(new URL(`../${asset.path}`, import.meta.url));
    assert.ok(contents.length > 0, asset.path);
    assert.doesNotMatch(contents.subarray(0, 128).toString(), /<!doctype html>|<html\b/i, asset.path);
    await access(new URL(`../dist/client/${asset.path.replace(/^public\//, "")}`, import.meta.url));
  }

  const viewerHtml = await readFile(new URL("../content/republications/chembricks-after-ebolathon-bdbv-gp-screen.html", import.meta.url), "utf8");
  const structures = [...viewerHtml.matchAll(/<option value="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(structures.length, 11);
  for (const id of structures) {
    const pdb = await readFile(new URL(`../public/republished/chembricks/media/blog/after-ebolathon-bdbv-gp-screen/structures/${id}.pdb`, import.meta.url), "utf8");
    assert.match(pdb, /^ATOM  /m, id);
    assert.match(pdb, /^HETATM.* L /m, id);
  }

  const viewerSource = await readFile(new URL("../app/lib/molecular-viewer.ts", import.meta.url), "utf8");
  assert.match(viewerSource, /chain: "A".*cartoon.*#a9c7e8/s);
  assert.match(viewerSource, /chain: "B".*cartoon.*#b7d9a5/s);
  assert.match(viewerSource, /chain: "L".*orangeCarbon/s);
  assert.match(viewerSource, /within: \{ distance: 5/);
});
