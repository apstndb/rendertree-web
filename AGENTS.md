# AGENTS.md

Client-side Spanner query plan viewer: React + Vite UI, Go WASM (`main.go`) for parsing/rendering. Plans stay in the browser.

## Layout

| Area | Role |
|------|------|
| `main.go` | WASM entry: `renderASCII`, `renderMermaid`, `renderSVG` (spannerplanviz) |
| `src/wasm.ts`, `src/types/wasm.ts` | JS ↔ WASM bridge and types |
| `WasmContext` / `AppContext` | Module load vs UI state |
| `InputPanel` / `OutputPanel` | Input, ASCII or Diagram output |
| `src/vite-plugin-go-wasm.ts` | Builds `dist/rendertree.wasm` on dev/build |
| `testdata/` | Sample plans (copied to dist) |

GitHub Pages base path: `/rendertree-web/`.

Graphviz in WASM uses `internal/stubs/go-findfont` (`replace` in `go.mod`) because host font scanning does not compile for `js/wasm`.

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
