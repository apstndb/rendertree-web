// Bundle-chunk budgets for the lazily-loaded rendering engines.
//
// Two heavy third-party engines are dynamically imported (see src/wasm.ts) so
// their wasm-bearing JS chunks are only downloaded when the matching view is
// used:
//   - @hpcc-js/wasm-graphviz  -> Graphviz SVG view
//   - @terrastruct/d2         -> D2 diagram view (browser build, wasm embedded)
//
// These budgets are REGRESSION DETECTORS, not hard limits. Per owner policy the
// large D2 chunk (multi-MB) is acceptable; the point of this check is to catch
// SUDDEN growth -- e.g. a dependency bump that inlines more, or an accidental
// static import that folds an engine into the entry bundle and defeats the lazy
// load. Each budget is the last measured size plus ~30% headroom. When a change
// intentionally moves a size, update the corresponding BUDGET here in the same
// PR and note why; do not treat the number as a ceiling to defend.
//
// Chunks carry a content hash in their filename, so we locate them structurally
// rather than by name: the largest dist/assets/*.js that is NOT referenced by
// dist/index.html (i.e. not an entry/preloaded chunk) and that contains a
// distinctive marker string for the engine.
//
// Measured 2026-07-08 (vite build):
//   Graphviz: raw ~794 KiB, gzip ~618 KiB (wasm embedded as base64).
//   D2:       raw ~7997 KiB, gzip ~5849 KiB (browser build embeds its wasm and
//             wasm_exec.js, and inlines its web worker as a Blob URL).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ASSETS_DIR = 'dist/assets';
const INDEX_HTML = 'dist/index.html';

// One entry per lazily-loaded engine chunk. `marker` is a distinctive string
// that survives minification and appears only in that engine's chunk; budgets
// are measured + ~30%.
const CHUNKS = [
  {
    label: 'Graphviz',
    // @hpcc-js/wasm-graphviz exposes a "Graphviz" class; the entry chunk also
    // mentions it but is excluded below as an index.html reference.
    marker: 'Graphviz',
    budgets: {
      raw: 1.05 * 1024 * 1024, // ~1.05 MiB
      gzip: 820 * 1024, // ~820 KiB
    },
  },
  {
    label: 'D2',
    // @terrastruct/d2's browser build references its embedded wasm as
    // "d2.wasm" (a string literal in the inlined worker loader); this appears
    // only in the D2 chunk.
    marker: 'd2.wasm',
    budgets: {
      raw: 10.4 * 1024 * 1024, // ~10.4 MiB
      gzip: 7.6 * 1024 * 1024, // ~7.6 MiB
    },
  },
];

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
// directly (the entry chunk and any modulepreload targets). Read each once.
const lazyChunks = assetFiles
  .filter((f) => !indexHtml.includes(f))
  .map((f) => ({ name: f, content: readFileSync(join(ASSETS_DIR, f)) }));

let failed = false;

for (const { label, marker, budgets } of CHUNKS) {
  // Buffer.includes(string) checks the utf8 bytes.
  const candidates = lazyChunks
    .filter(({ content }) => content.includes(marker))
    .sort((a, b) => b.content.length - a.content.length);

  if (candidates.length === 0) {
    fail(
      `Could not locate the ${label} chunk: no non-entry dist/assets/*.js ` +
      `contains "${marker}". Did the build change how the engine is bundled ` +
      `(e.g. it is now statically imported into the entry chunk)? Update ` +
      `scripts/check-chunk-size.mjs.`
    );
  }

  const chunk = candidates[0];
  const sizes = {
    raw: chunk.content.length,
    gzip: gzipSync(chunk.content, { level: 9 }).length,
  };

  console.log(`info ${label} chunk: ${chunk.name}`);
  for (const [kind, size] of Object.entries(sizes)) {
    const budget = budgets[kind];
    const ok = size <= budget;
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label} ${kind.padEnd(5)} ${kib(size)} (budget ${kib(budget)})`);
    if (!ok) failed = true;
  }
}

if (failed) {
  fail(
    '\nA lazy-chunk budget was exceeded. These budgets are regression ' +
    'detectors, not hard limits: if the growth is intentional, raise the ' +
    'matching BUDGET in scripts/check-chunk-size.mjs in the same PR and ' +
    'explain why.'
  );
}
