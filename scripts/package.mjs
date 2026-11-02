import { execFile } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { promisify } from "node:util";

const run = promisify(execFile);
await run(process.execPath, ["scripts/build.mjs"]);
await mkdir("release", { recursive: true });
await rm("release/formguard-v0.1.0.zip", { force: true });
await run("zip", ["-qr", "../release/formguard-v0.1.0.zip", "."], { cwd: "dist" });
console.log("Created release/formguard-v0.1.0.zip");
