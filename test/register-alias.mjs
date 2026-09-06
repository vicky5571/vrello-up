import fs from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const srcDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src");

function probe(base) {
  const candidates = [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts"), base];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return pathToFileURL(candidate).href;
    } catch {
      // Not a file — try the next candidate.
    }
  }
  return null;
}

// Maps the `@/` tsconfig-paths alias to `./src/` so the plain
// `node --test` runner can import store modules without a bundler.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith("@/")) {
      const url = probe(path.join(srcDir, specifier.slice(2)));
      if (url) return { url, shortCircuit: true };
    }
    return next(specifier, context);
  },
});
