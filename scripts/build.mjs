import { build, context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outdir = path.join(root, "dist");
const watch = process.argv.includes("--watch");

async function copyStatic() {
  await mkdir(path.join(outdir, "popup"), { recursive: true });
  await mkdir(path.join(outdir, "options"), { recursive: true });
  await mkdir(path.join(outdir, "icons"), { recursive: true });
  await cp(path.join(root, "manifest.json"), path.join(outdir, "manifest.json"));
  for (const file of ["popup.html", "popup.css"]) {
    await cp(path.join(root, "popup", file), path.join(outdir, "popup", file));
  }
  for (const file of ["options.html", "options.css"]) {
    await cp(path.join(root, "options", file), path.join(outdir, "options", file));
  }
  for (const size of [16, 48, 128]) {
    await cp(path.join(root, "icons", `${size}.png`), path.join(outdir, "icons", `${size}.png`));
  }
}

const options = {
  entryPoints: {
    "src/content": "src/content.ts",
    "popup/popup": "popup/popup.ts",
    "options/options": "options/options.ts"
  },
  bundle: true,
  format: "iife",
  target: "chrome110",
  outdir,
  sourcemap: true,
  logLevel: "info"
};

await rm(outdir, { recursive: true, force: true });
await copyStatic();

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  console.log("Watching TypeScript. Re-run build after static HTML/CSS changes.");
} else {
  await build(options);
  console.log(`Built FormGuard in ${outdir}`);
}
