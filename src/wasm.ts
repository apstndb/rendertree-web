// No need to import wasm_exec.js as it's loaded from GOROOT in index.html
import type { WasmFunctions, RenderParams, RenderMode, FormatType } from './types/wasm';

// Declare Go class from wasm_exec.js
declare class Go {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

// Declare import.meta.env
interface ImportMetaEnv {
  DEV: boolean;
  BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// These functions will be globally available after WASM initialization
declare function renderASCII(paramsJson: string): string;

let wasmInitialized = false;

/**
 * Initialize WebAssembly module
 * @returns Object containing WASM functions
 */
export async function initWasm(): Promise<WasmFunctions> {
  if (wasmInitialized) {
    return { renderASCII };
  }

  const go = new Go();
  try {
    // Determine if we're in development mode based on the URL
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // In development mode, use a relative path to ensure proper MIME type handling
    const wasmPath = isDev ? "./dist/rendertree.wasm" : "./assets/rendertree.wasm";

    // Add cache-busting query parameter in development mode to prevent caching issues
    const wasmUrl = isDev ? `${wasmPath}?t=${Date.now()}` : wasmPath;

    console.log(`Loading WebAssembly from: ${wasmUrl}`);
    const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), go.importObject);
    go.run(result.instance);
    wasmInitialized = true;
    return { renderASCII };
  } catch (e) {
    console.error("Error initializing WebAssembly:", e);
    throw e;
  }
}

/**
 * Render ASCII representation of query plan
 * @param input Query plan JSON or YAML
 * @param mode Render mode (AUTO, PLAN, PROFILE)
 * @param format Format (CURRENT, TRADITIONAL, COMPACT)
 * @param wrapWidth Wrap width (0 for no wrap)
 * @returns ASCII representation of query plan
 */
export async function renderASCIITree(
  input: string, 
  mode: RenderMode = 'AUTO', 
  format: FormatType = 'CURRENT', 
  wrapWidth: number = 0
): Promise<string> {
  const wasmFunctions = await initWasm();

  const params: RenderParams = {
    input,
    mode,
    format,
    wrapWidth
  };

  return wasmFunctions.renderASCII(JSON.stringify(params));
}
