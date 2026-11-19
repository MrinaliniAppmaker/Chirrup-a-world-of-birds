import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
if (process.env.NODE_ENV === "production" || !process.env.REPLIT_DEV_DOMAIN) {
  throw new Error("Run account checks only in the development workspace.");
}
const output = fileURLToPath(new URL("../.local/account-journal.integration.mjs", import.meta.url));
await build({
  entryPoints: [fileURLToPath(new URL("./account-journal.integration.ts", import.meta.url))],
  outfile: output, bundle: true, platform: "node", format: "esm",
  external: ["@google-cloud/*", "pg-native"],
  banner: { js: 'import {createRequire} from "node:module"; const require=createRequire(import.meta.url);' },
});
await import(pathToFileURL(output).href);
