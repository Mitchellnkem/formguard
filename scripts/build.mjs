import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await build({
  entryPoints: {
    content: "src/content/index.ts",
    popup: "src/popup/index.ts",
    options: "src/options/index.ts"
  },
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: false,
  sourcemap: false,
  legalComments: "none"
});

await cp("static", "dist", { recursive: true });
const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
await writeFile("dist/manifest.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log("Built unpacked extension in dist/");
