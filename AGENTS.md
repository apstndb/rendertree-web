# AGENTS.md

Client-side Spanner query plan viewer: React + Vite UI, Go WASM (`main.go`) for parsing/rendering. Plans stay in the browser.

## Layout

| Area | Role |
|------|------|
| `main.go` | WASM entry: `renderASCII`, `renderMermaid`, `renderDOT`, `renderD2` (spannerplanviz) |
| `src/wasm.ts`, `src/types/wasm.ts` | JS ↔ WASM bridge and types |
| `WasmContext` / `AppContext` | Module load vs UI state |
| `InputPanel` / `OutputPanel` | Input, ASCII or Diagram output |
| `src/vite-plugin-go-wasm.ts` | Builds `dist/rendertree.wasm` on dev/build |
| `testdata/` | Sample plans (copied to dist) |

GitHub Pages base path: `/rendertree-web/`.

Graphviz layout runs in the browser: Go WASM emits DOT source (`spannerplanviz/dot`), and `src/wasm.ts` lazily loads `@hpcc-js/wasm-graphviz` to produce SVG. Do not reintroduce `goccy/go-graphviz` into the Go module — it embeds a Graphviz WASM runtime plus a font stack and roughly doubles the binary (CI enforces budgets via `npm run check:wasm-size`).

D2 diagrams are also rendered in the browser: Go WASM emits D2 source (`renderD2`), and `src/wasm.ts` lazily loads `@terrastruct/d2` (`renderD2Diagram`) to compile+lay-out the source to SVG. That browser bundle is large (~8 MB raw, wasm embedded, self-hosted web worker), so it is dynamically imported as its own lazy chunk; `npm run check:chunk-size` tracks both the Graphviz and D2 chunks as regression detectors (not hard limits — the D2 chunk size is accepted). Copy/Download on the D2 view still operate on the raw D2 source (`.d2`), so users can render it externally with the d2 CLI.

## Before push

CI runs **`tsc`** in both Tests (`npm run typecheck`) and Deploy (`npm run build`). These do **not** run typecheck:

- `npm run dev`
- `npm run build:wasm`
- `npm run test:unit`

Minimum before push:

```bash
npm run typecheck
```

Recommended:

```bash
npm run test:ci   # lint + typecheck + unit + preview e2e
```

After push: `gh run list --branch main --limit 3`

## TypeScript

`strict` + **`noUncheckedIndexedAccess`**. Do not use bare `[0]` on arrays, tuples, `TouchList`, or `NodeList`; use `.item(n)` with null checks or length guards.

Use `window.setTimeout()` when the return type matters.

WASM contract changes need updates in Go, `src/types/wasm.ts`, and related tests.

## Conventions

- Match existing patterns; minimal diffs.
- Commit messages: present tense, same style as recent history (`feat:`, `fix:`, `chore(deps):`).
- Playwright covers Chromium, Firefox, WebKit in CI.

## Useful commands

```bash
npm run dev
npm run lint
npm run typecheck
npm run test:unit
npm test
npm run test:preview
npm run test:prod    # https://apstndb.github.io/rendertree-web/
```
