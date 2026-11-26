import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Local operator tooling only. These entry points are never HTTP routes.
const entries = { reports: "reviewContentReports.ts", "delete-account": "fulfillAccountDeletion.ts" };
const [command, ...args] = process.argv.slice(2).filter(arg => arg !== "--");
if (!Object.hasOwn(entries, command ?? "")) {
  console.error("Choose a supported maintenance command: reports or delete-account");
  process.exit(1);
}
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const output = path.join(root, "artifacts/api-server/dist", `operator-${command}.cjs`);
await build({
  entryPoints: [path.join(root, "artifacts/api-server/src/scripts", entries[command])],
  outfile: output, bundle: true, platform: "node", format: "cjs",
  external: ["@google-cloud/storage", "@clerk/express", "pg-native"], logLevel: "error",
});
const result = spawnSync(process.execPath, [output, ...args], { stdio: "inherit", cwd: root, env: process.env });
if (result.error) console.error("Could not start the maintenance command.");
process.exit(result.status ?? 1);
