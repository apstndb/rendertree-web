// Import wasm_exec.js
import './wasm_exec.js';

// Declare Go class from wasm_exec.js
declare class Go {
  importObject: WebAssembly.Imports;
  run(instance: WebAssembly.Instance): Promise<void>;
}

// These functions will be globally available after WASM initialization
declare function renderASCII(paramsJson: string): string;

let wasmInitialized = false;

/**
 * Initialize WebAssembly module
 * @returns Object containing WASM functions
 */
export async function initWasm(): Promise<{ renderASCII: typeof renderASCII }> {
  if (wasmInitialized) {
    return { renderASCII };
  }

  const go = new Go();
  try {
    const result = await WebAssembly.instantiateStreaming(fetch("./assets/rendertree.wasm"), go.importObject);
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
  mode: string = 'AUTO', 
  format: string = 'CURRENT', 
  wrapWidth: number = 0
): Promise<string> {
  const wasmFunctions = await initWasm();

  const params = {
    input,
    mode,
    format,
    wrapWidth
  };

  return wasmFunctions.renderASCII(JSON.stringify(params));
}
