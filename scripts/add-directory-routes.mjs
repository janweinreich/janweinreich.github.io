import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const outputDirectory = fileURLToPath(new URL("../dist/client/", import.meta.url));

async function findHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const pathname = path.join(directory, entry.name);
    if (entry.isDirectory()) return findHtmlFiles(pathname);
    if (entry.isFile() && entry.name.endsWith(".html")) return [pathname];
    return [];
  }));
  return nested.flat();
}

const htmlFiles = await findHtmlFiles(outputDirectory);
for (const source of htmlFiles) {
  const relative = path.relative(outputDirectory, source);
  if (relative === "index.html" || relative === "404.html") continue;

  const route = relative.slice(0, -".html".length);
  const destination = path.join(outputDirectory, route, "index.html");
  await mkdir(path.dirname(destination), { recursive: true });
  await copyFile(source, destination);
}
