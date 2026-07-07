// Bundle budget check for the Go WASM binary.
//
// Records raw/gzip/brotli sizes of dist/rendertree.wasm and fails when a
// budget is exceeded, so size regressions (e.g. reintroducing a Graphviz
// runtime into the Go module) are caught in CI rather than discovered by
// users. Budgets are intentionally a little above the current measurements;
// lower them after intentional size wins, raise them only with justification
// in the same PR.
import { readFileSync } from 'node:fs';
import { gzipSync, brotliCompressSync } from 'node:zlib';

const WASM_PATH = 'dist/rendertree.wasm';

// Current measurements (2026-07-08, Go 1.24, after moving Graphviz layout to
// the browser): raw ~25.4 MB, gzip ~5.5 MB, brotli ~4.6 MB.
const BUDGETS = {
  raw: 28 * 1024 * 1024,
  gzip: 6.5 * 1024 * 1024,
  brotli: 5.5 * 1024 * 1024,
};

const mib = (n) => `${(n / 1024 / 1024).toFixed(2)} MiB`;

let wasm;
try {
  wasm = readFileSync(WASM_PATH);
} catch {
  console.error(`${WASM_PATH} not found; run \`npm run build:wasm\` first.`);
  process.exit(1);
}

const sizes = {
  raw: wasm.length,
  gzip: gzipSync(wasm, { level: 9 }).length,
  brotli: brotliCompressSync(wasm).length,
};

let failed = false;
for (const [kind, size] of Object.entries(sizes)) {
  const budget = BUDGETS[kind];
  const ok = size <= budget;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${kind.padEnd(6)} ${mib(size)} (budget ${mib(budget)})`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('\nWASM size budget exceeded. If the growth is intentional, adjust BUDGETS in scripts/check-wasm-size.mjs in the same PR and explain why.');
  process.exit(1);
}
