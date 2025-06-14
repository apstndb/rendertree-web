// No need to import wasm_exec.js as it's loaded from GOROOT in index.html
import type { WasmFunctions, RenderParams, RenderMode, FormatType } from './types/wasm';
import { logger } from './utils/logger';
import { WasmInitializationError, WasmRenderingError } from './errors/WasmErrors';

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
  logger.debug('initWasm called, wasmInitialized:', wasmInitialized);

  if (wasmInitialized) {
    logger.info('WASM already initialized, returning existing instance');
    return { renderASCII };
  }

  logger.info('Starting WASM initialization');
  const go = new Go();
  try {
    // Check if we're in preview or production mode by looking for the base path in the URL
    // This applies to both preview mode (vite preview) and production (GitHub Pages)
    // as both serve the application under the /rendertree-web/ path
    const isPathBased = window.location.pathname.includes('/rendertree-web/');
    logger.debug('Path-based environment detected:', isPathBased);

    // Determine the correct path for the WASM file based on the environment
    // We tried to unify the base path for all environments, but it caused issues in development mode
    // The main issue was that the WASM file is built and placed in different locations in dev vs. preview/production
    // So we need to use different paths for different environments
    let wasmPath;

    if (isPathBased) {
      // In path-based environments (preview or production), use the assets directory
      // where Vite actually serves the WASM file
      wasmPath = "./assets/rendertree.wasm";
    } else {
      // In development mode, use the dist directory
      wasmPath = "./dist/rendertree.wasm";
    }

    logger.debug('WASM path:', wasmPath);

    // Never add cache-busting query parameter as it interferes with MIME type detection
    const wasmUrl = wasmPath;

    logger.info(`Loading WebAssembly from: ${wasmUrl}`);

    // Start fetch
    logger.debug('Starting fetch for WASM file');
    const fetchResponse = await fetch(wasmUrl);

    if (!fetchResponse.ok) {
      const errorMsg = `Failed to fetch WASM file: ${fetchResponse.status} ${fetchResponse.statusText}`;
      logger.error(errorMsg);
      throw new WasmInitializationError(errorMsg);
    }

    logger.debug('WASM file fetched successfully, starting instantiation');
    const result = await WebAssembly.instantiateStreaming(fetchResponse, go.importObject);

    logger.debug('WASM instantiated, starting Go runtime');
    go.run(result.instance);

    logger.info('WASM initialization completed successfully');
    wasmInitialized = true;
    return { renderASCII };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logger.error("Error initializing WebAssembly:", errorMsg);

    // Wrap the error in our custom error class for better identification
    throw new WasmInitializationError(errorMsg, e instanceof Error ? e : undefined);
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
  logger.info('renderASCIITree called with mode:', mode, 'format:', format, 'wrapWidth:', wrapWidth);
  logger.debug('Input length:', input.length, 'characters');

  try {
    logger.debug('Initializing WASM for rendering');
    const wasmFunctions = await initWasm();

    const params: RenderParams = {
      input,
      mode,
      format,
      wrapWidth
    };

    logger.debug('Calling WASM renderASCII function');
    const paramsJson = JSON.stringify(params);
    logger.debug('Params JSON length:', paramsJson.length, 'characters');

    const startTime = performance.now();
    const result = wasmFunctions.renderASCII(paramsJson);
    const endTime = performance.now();

    logger.info(`Rendering completed in ${(endTime - startTime).toFixed(2)}ms`);
    logger.debug('Result length:', result.length, 'characters');

    return result;
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logger.error('Error during rendering:', errorMsg);

    // Wrap the error in our custom error class for better identification
    throw new WasmRenderingError(errorMsg, e instanceof Error ? e : undefined);
  }
}
