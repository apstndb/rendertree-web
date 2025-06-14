// No need to import wasm_exec.js as it's loaded from GOROOT in index.html
import type { WasmFunctions, RenderParams, RenderMode, FormatType, WasmResponse } from './types/wasm';
import { logger } from './utils/logger';
import { WasmInitializationError, WasmRenderingError } from './errors/WasmErrors';
import { extractErrorInfo } from './utils/errorHandling';

// Go class will be available globally after wasm_exec.js loads
// We access it via globalThis to handle dynamic loading timing

// Note: TypeScript needs to know about import.meta.env for type checking,
// but we access it implicitly through the environment so no explicit interface is needed

// These functions will be globally available after WASM initialization
declare function renderASCII(paramsJson: string): string;

let wasmInitialized = false;

/**
 * Wait for Go class to be available (loaded by wasm_exec.js)
 */
async function waitForGo(): Promise<void> {
  const maxWaitTime = 10000; // 10 seconds
  const pollInterval = 100; // 100ms
  const startTime = Date.now();
  
  while (typeof (globalThis as any).Go === 'undefined') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Timeout waiting for Go class to be loaded from wasm_exec.js');
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  logger.debug('Go class is now available');
}

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
  
  // Wait for Go class to be available from wasm_exec.js
  logger.debug('Waiting for Go class to be loaded...');
  await waitForGo();
  
  const go = new ((globalThis as any).Go)();
  try {
    // Simplified WASM path resolution using Vite environment detection
    // Use import.meta.env to determine the environment instead of URL parsing
    const isDevelopment = import.meta.env.DEV;
    const isPreview = import.meta.env.VITE_PREVIEW === 'true';
    
    logger.debug('Environment detection:', { isDevelopment, isPreview });

    // Determine WASM path based on environment
    let wasmPath: string;
    
    if (isDevelopment) {
      // Development mode: WASM is in dist directory
      wasmPath = "./dist/rendertree.wasm";
    } else {
      // Production/Preview mode: WASM is processed by Vite build
      wasmPath = "./assets/rendertree.wasm";
    }

    logger.debug('WASM path resolved to:', wasmPath);

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
    const { message, originalError } = extractErrorInfo(e);
    logger.error("Error initializing WebAssembly:", message);

    // Wrap the error in our custom error class for better identification
    throw new WasmInitializationError(message, originalError);
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
    const resultStr = wasmFunctions.renderASCII(paramsJson);
    const endTime = performance.now();

    logger.info(`Rendering completed in ${(endTime - startTime).toFixed(2)}ms`);
    logger.debug('Result string length:', resultStr.length, 'characters');

    // Parse the structured response from WASM
    let response: WasmResponse;
    try {
      response = JSON.parse(resultStr);
    } catch (parseError) {
      logger.error('Failed to parse WASM response JSON:', parseError instanceof Error ? parseError.message : String(parseError));
      throw new WasmRenderingError('Invalid response format from WASM module');
    }

    // Handle the response based on success/failure
    if (response.success && response.result !== undefined) {
      logger.debug('WASM returned successful result, length:', response.result.length, 'characters');
      return response.result;
    } else if (response.error) {
      logger.error('WASM returned error:', response.error);
      const errorMsg = `${response.error.message}${response.error.details ? ': ' + response.error.details : ''}`;
      throw new WasmRenderingError(errorMsg);
    } else {
      logger.error('Invalid WASM response structure:', response);
      throw new WasmRenderingError('Invalid response structure from WASM module');
    }
  } catch (e) {
    const { message, originalError } = extractErrorInfo(e);
    logger.error('Error during rendering:', message);

    // Wrap the error in our custom error class for better identification
    throw new WasmRenderingError(message, originalError);
  }
}
