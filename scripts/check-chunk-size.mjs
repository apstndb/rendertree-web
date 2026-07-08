// Bundle-chunk budget for the lazily-loaded Graphviz layout engine.
//
// @hpcc-js/wasm-graphviz is dynamically imported (see src/wasm.ts) so its
// wasm-bearing JS chunk is only downloaded when the Graphviz SVG view is
// used. This check keeps that chunk from silently ballooning -- e.g. a
// dependency bump that inlines more, or an accidental static import that
// folds Graphviz into the entry bundle and defeats the lazy load.
//
// The chunk carries a content hash in its filename, so we locate it
// structurally rather than by name: the largest dist/assets/*.js that is
// NOT referenced by dist/index.html (i.e. not an entry/preloaded chunk) and
// that contains the string "Graphviz".
//
// Measured 2026-07-08 (vite build): raw ~794 KiB, gzip ~618 KiB. The chunk
// embeds the Graphviz wasm as base64, hence the poor gzip ratio. Budgets are
// measured + ~30% headroom; lower them after intentional size wins, raise
// them only with justification in the same PR.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ASSETS_DIR = 'dist/assets';
const INDEX_HTML = 'dist/index.html';

const BUDGETS = {
  raw: 1.05 * 1024 * 1024, // ~1.05 MiB
  gzip: 820 * 1024, // ~820 KiB
};

const kib = (n) => `${(n / 1024).toFixed(1)} KiB`;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

let indexHtml;
try {
  indexHtml = readFileSync(INDEX_HTML, 'utf8');
} catch {
  fail(`${INDEX_HTML} not found; run \`npm run build\` first.`);
}

let assetFiles;
try {
  assetFiles = readdirSync(ASSETS_DIR).filter((f) => f.endsWith('.js'));
} catch {
  fail(`${ASSETS_DIR} not found; run \`npm run build\` first.`);
}

// Consider only lazily-loaded chunks: drop anything index.html references
// directly (the entry chunk and any modulepreload targets).
const candidates = assetFiles
  .filter((f) => !indexHtml.includes(f))
  .map((f) => ({ name: f, content: readFileSync(join(ASSETS_DIR, f)) }))
  // Buffer.includes(string) checks the utf8 bytes; the entry chunk also
  // mentions "Graphviz" but is already excluded above as an index.html ref.
  .filter(({ content }) => content.includes('Graphviz'))
  .sort((a, b) => b.content.length - a.content.length);

if (candidates.length === 0) {
  fail(
    'Could not locate the Graphviz chunk: no non-entry dist/assets/*.js ' +
    'contains "Graphviz". Did the build change how @hpcc-js/wasm-graphviz is ' +
    'bundled (e.g. it is now statically imported into the entry chunk)? ' +
    'Update scripts/check-chunk-size.mjs.'
  );
}

const chunk = candidates[0];
const sizes = {
  raw: chunk.content.length,
  gzip: gzipSync(chunk.content, { level: 9 }).length,
};

console.log(`info Graphviz chunk: ${chunk.name}`);

let failed = false;
for (const [kind, size] of Object.entries(sizes)) {
  const budget = BUDGETS[kind];
  const ok = size <= budget;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${kind.padEnd(5)} ${kib(size)} (budget ${kib(budget)})`);
  if (!ok) failed = true;
}

if (failed) {
  fail(
    '\nGraphviz chunk budget exceeded. If the growth is intentional, adjust ' +
    'BUDGETS in scripts/check-chunk-size.mjs in the same PR and explain why.'
  );
}
