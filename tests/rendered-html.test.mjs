import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

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
  assert.match(html, /href="\/writing\/"/);
  assert.match(html, /href="https:\/\/github\.com\/janweinreich"/);
  assert.match(html, /One Structure, Three Languages/);
  assert.doesNotMatch(html, /Your site is taking shape|Starter Project/);

  const articles = html.match(/<ol[^>]*id="home-articles"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(articles, "The article index is present in the initial HTML");
  assert.match(articles, /href="\/writing\/ten-angstroms-of-a-cysteine\/"/);
  assert.doesNotMatch(articles, /\shidden[\s=>]/);
  const sources = JSON.parse(await readFile(new URL("../content/republications/sources/chembricks.json", import.meta.url), "utf8"));
  for (const article of sources.articles) {
    assert.ok(articles.includes(`href="/writing/${article.slug}/"`), article.slug);
  }
  assert.match(html, /aria-label="Filter writing by subject"/);
  assert.match(html, /Lorenz attractor/);
});

test("starts in white and restores only an explicitly saved dark theme", async () => {
  const html = await (await render()).text();
  assert.match(html, /<html[^>]*data-theme="light"/);
  assert.match(html, /name="theme-color" content="#ffffff"/);
  assert.match(html, /aria-label="Switch to dark theme"/);
  const script = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)]
    .map(([, body]) => body)
    .find((body) => body.includes("localStorage.getItem(\"blog-theme\")"));
  assert.ok(script, "The saved-theme initializer is included in the rendered page");

  for (const saved of [null, "light", "dark", "invalid", "unavailable"]) {
    const root = { dataset: { theme: "light" } };
    let browserColour = "#ffffff";
    runInNewContext(script, {
      document: {
        documentElement: root,
        querySelector: () => ({ setAttribute: (_name, value) => { browserColour = value; } }),
      },
      localStorage: { getItem: () => {
        if (saved === "unavailable") throw new Error("Storage disabled");
        return saved;
      } },
      window: { matchMedia: () => { throw new Error("System preferences must not choose the theme"); } },
    });
    assert.equal(root.dataset.theme, saved === "dark" ? "dark" : "light", String(saved));
    assert.equal(browserColour, saved === "dark" ? "#101418" : "#ffffff", String(saved));
  }

  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.doesNotMatch(css, /@media\s*\(prefers-color-scheme:\s*dark\)/);
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

  await access(new URL("../dist/client/writing/index.html", import.meta.url));
  await access(new URL("../dist/client/writing/chembricks-after-ebolathon-bdbv-gp-screen/index.html", import.meta.url));
  await access(new URL("../dist/client/writing/chembricks-after-ebolathon-bdbv-gp-screen.html", import.meta.url));
});

test("publishes What Is Left with its illustration and homepage feature", async () => {
  const [home, article, archive] = await Promise.all([
    render(),
    render("/writing/what-is-left"),
    render("/writing"),
  ]);
  assert.equal(article.status, 200);
  const [homeHtml, articleHtml, archiveHtml] = await Promise.all([
    home.text(), article.text(), archive.text(),
  ]);
  const articles = homeHtml.match(/<ol[^>]*id="home-articles"[^>]*>([\s\S]*?)<\/ol>/)?.[1];
  assert.ok(articles);
  assert.equal(articles.match(/href="([^\"]+)"/)?.[1], "/writing/what-is-left/");
  assert.match(articles, /Latest article/);
  assert.match(articles, /src="\/writing\/what-is-left\/room-to-explore\.jpg"/);
  assert.match(articles, /srcSet="[^\"]*room-to-explore-768\.jpg 768w/);
  assert.match(archiveHtml, /href="\/writing\/what-is-left\/"/);
  assert.match(articleHtml, /<h1>What Is Left\?<\/h1>/);
  assert.match(articleHtml, /dateTime="2026-11-02"/i);
  assert.match(articleHtml, /<figure class="article-illustration">/);
  assert.match(articleHtml, /alt="Two researchers face a branching landscape of ideas/);
  assert.match(articleHtml, /Illustration generated with AI\./);
  assert.match(articleHtml, /the freedom to follow one through depend more heavily on what we can afford/);
  assert.match(articleHtml, /property="og:image" content="https:\/\/janweinreich\.github\.io\/writing\/what-is-left\/room-to-explore\.jpg"/);
  assert.match(articleHtml, /rel="canonical" href="https:\/\/janweinreich\.github\.io\/writing\/what-is-left\/"/);

  const exported = await readFile(new URL("../dist/client/writing/what-is-left/index.html", import.meta.url), "utf8");
  assert.match(exported, /<h1>What Is Left\?<\/h1>/);
  const image = await readFile(new URL("../dist/client/writing/what-is-left/room-to-explore.jpg", import.meta.url));
  assert.equal(image.subarray(0, 3).toString("hex"), "ffd8ff");
  await access(new URL("../dist/client/writing/what-is-left/room-to-explore-768.jpg", import.meta.url));
  const sitemap = await readFile(new URL("../dist/client/sitemap.xml", import.meta.url), "utf8");
  assert.match(sitemap, /https:\/\/janweinreich\.github\.io\/writing\/what-is-left\//);
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
