
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.resolve(scriptDir, "../data");

await mkdir(outputDir, { recursive: true });

const files = {
  "base.json":
    "https://raw.githubusercontent.com/AdiyogiArts/gita-json/main/base.json",
  "en.json":
    "https://raw.githubusercontent.com/AdiyogiArts/gita-json/main/en.json",
  "hi.json":
    "https://raw.githubusercontent.com/AdiyogiArts/gita-json/main/hi.json",
};

for (const [filename, url] of Object.entries(files)) {
  console.log(`Downloading ${filename}...`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${filename}: HTTP ${response.status}`
    );
  }

  const content = await response.text();

  // Validate JSON before saving.
  JSON.parse(content);

  await writeFile(
    path.join(outputDir, filename),
    content,
    "utf8"
  );

  console.log(`Saved ${filename}`);
}

console.log("Gita data download completed.");
