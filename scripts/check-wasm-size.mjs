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
import { execSync } from 'node:child_process';

const WASM_PATH = 'dist/rendertree.wasm';

// Current measurements (2026-07-08, go1.25/1.26 builds after the grpc/x-net
// security bump): raw ~24.29 MiB, gzip ~5.26 MiB, brotli ~3.70 MiB. CI is the
// enforcement point and builds deterministically with the go.mod go directive
// (setup-go go-version-file + GOTOOLCHAIN=local); the go.mod toolchain line
// is only a lower bound locally, so a newer local Go may measure slightly
// differently. The informational `go version` line below records which
// toolchain produced these bytes.
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

// Record the Go toolchain for context: WASM size varies with the compiler
// version, so the measurements above are only meaningful alongside it.
try {
  const goVersion = execSync('go version', { encoding: 'utf8' }).trim();
  console.log(`info Built with: ${goVersion}`);
} catch {
  console.log('info Built with: unknown (go not found on PATH)');
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
