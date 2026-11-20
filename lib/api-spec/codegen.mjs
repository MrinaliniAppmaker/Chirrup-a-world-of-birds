import { copyFile, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const cwd = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(cwd, "../..");
const cache = path.join(root, "node_modules/.cache");
await mkdir(cache, { recursive: true });
const stage = await mkdtemp(path.join(cache, "chirrup-codegen-"));
async function files(directory, prefix = "") {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(prefix, entry.name);
    if (entry.isDirectory()) result.push(...await files(path.join(directory, entry.name), name));
    else result.push(name);
  }
  return result;
}
try {
  const stagedClient = path.join(stage, "api-client-react/src");
  await mkdir(stagedClient, { recursive: true });
  // Keep the same relative mutator import in staged and published modules.
  await copyFile(path.join(root, "lib/api-client-react/src/custom-fetch.ts"), path.join(stagedClient, "custom-fetch.ts"));
  const generated = spawnSync("pnpm", ["exec", "orval", "--config", "./orval.config.ts"], {
    cwd, env: { ...process.env, ORVAL_OUTPUT_ROOT: stage }, stdio: "inherit",
  });
  if (generated.error || generated.status !== 0) throw generated.error ?? new Error("API generation failed; live files were left unchanged.");
  for (const packageName of ["api-client-react", "api-zod"]) {
    const source = path.join(stage, packageName, "src/generated");
    const destination = path.join(root, "lib", packageName, "src/generated");
    const names = await files(source);
    // Publish dependencies before their entry points. Never delete a live
    // generated directory: Metro may be serving a user's screen at this moment.
    const rank = (name) => name === "api.ts" ? 2 : path.basename(name) === "index.ts" ? 1 : 0;
    names.sort((a, b) => rank(a) - rank(b));
    for (const name of names) {
      const target = path.join(destination, name);
      const contents = await readFile(path.join(source, name));
      let previous;
      try { previous = await readFile(target); } catch (error) { if (error.code !== "ENOENT") throw error; }
      if (previous?.equals(contents)) continue;
      await mkdir(path.dirname(target), { recursive: true });
      const temporary = `${target}.next`;
      await writeFile(temporary, contents);
      await rename(temporary, target);
    }
    const wanted = new Set(names);
    for (const old of await files(destination)) {
      if (!wanted.has(old)) await rm(path.join(destination, old));
    }
  }
} finally {
  await rm(stage, { recursive: true, force: true });
}
