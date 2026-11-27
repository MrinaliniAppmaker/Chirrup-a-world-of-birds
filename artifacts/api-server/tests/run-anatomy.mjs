import { build } from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = fileURLToPath(new URL("../.local/anatomy-regressions.mjs", import.meta.url));
await build({
  stdin: {
    contents: [
      "./src/lib/birdDesign.test.ts",
      "./src/lib/anatomyGuides.test.ts",
      "./src/lib/cootFootReference.test.ts",
      "./tests/trait-selection.test.ts",
    ].map(path => `import ${JSON.stringify(path)};`).join("\n"),
    resolveDir: root,
    sourcefile: "anatomy-regressions.ts",
  },
  outfile: output, bundle: true, platform: "node", format: "esm",
  external: ["@resvg/resvg-js"],
  banner: { js: 'import {createRequire} from "node:module"; const require=createRequire(import.meta.url);' },
});
await import(pathToFileURL(output).href);
