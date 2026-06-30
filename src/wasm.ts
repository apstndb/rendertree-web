// No need to import wasm_exec.js as it's loaded from GOROOT in index.html
import type { WasmFunctions, RenderParams, RenderMermaidParams, RenderMode, FormatType, RenderAppendixOptions, WasmResponse } from './types/wasm';
import { logger } from './utils/logger';
import { WasmInitializationError, WasmRenderingError } from './errors/WasmErrors';
import { extractErrorInfo } from './utils/errorHandling';

// Go class will be available globally after wasm_exec.js loads
// We access it via globalThis to handle dynamic loading timing

// These functions will be globally available after WASM initialization
declare function renderASCII(paramsJson: string): string;
declare function renderMermaid(paramsJson: string): string;

let cachedWasmFunctions: WasmFunctions | null = null;
let initPromise: Promise<WasmFunctions> | null = null;

/**
 * Wait for Go class to be available (loaded by wasm_exec.js)
 */
async function waitForGo(): Promise<void> {
  const maxWaitTime = 10000;
  const pollInterval = 100;
  const startTime = Date.now();

  while (typeof (globalThis as typeof globalThis & { Go?: unknown }).Go === 'undefined') {
    if (Date.now() - startTime > maxWaitTime) {
      throw new Error('Timeout waiting for Go class to be loaded from wasm_exec.js');
    }
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }

  logger.debug('Go class is now available');
}

function parseWasmResponse(resultStr: string): string {
  let response: WasmResponse;
  try {
    response = JSON.parse(resultStr);
  } catch (parseError) {
    logger.error('Failed to parse WASM response JSON:', parseError instanceof Error ? parseError.message : String(parseError));
    throw new WasmRenderingError('Invalid response format from WASM module');
  }

  if (response.success && response.result !== undefined) {
    return response.result;
  }
  if (response.error) {
    logger.error('WASM returned error:', response.error);
    const errorMsg = `${response.error.message}${response.error.details ? ': ' + response.error.details : ''}`;
    throw new WasmRenderingError(errorMsg);
  }

  logger.error('Invalid WASM response structure:', response);
  throw new WasmRenderingError('Invalid response structure from WASM module');
}

function invokeWasm(fn: (paramsJson: string) => string, paramsJson: string): string {
  const startTime = performance.now();
  const resultStr = fn(paramsJson);
  const endTime = performance.now();
  logger.info(`WASM call completed in ${(endTime - startTime).toFixed(2)}ms`);
  return parseWasmResponse(resultStr);
}

/**
 * Initialize WebAssembly module
 */
export async function initWasm(): Promise<WasmFunctions> {
  logger.debug('initWasm called, cached:', !!cachedWasmFunctions);

  if (cachedWasmFunctions) {
    logger.info('WASM already initialized, returning existing instance');
    return cachedWasmFunctions;
  }

  if (initPromise) {
    logger.info('WASM initialization already in progress, returning existing promise');
    return initPromise;
  }

  initPromise = initializeWasm();
  return initPromise;
}

async function initializeWasm(): Promise<WasmFunctions> {
  logger.info('Starting WASM initialization');

  try {
    await waitForGo();

    const go = new ((globalThis as typeof globalThis & { Go: new () => { importObject: WebAssembly.Imports; run: (instance: WebAssembly.Instance) => Promise<void> } }).Go)();

    const isDevelopment = import.meta.env.DEV;
    const wasmPath = isDevelopment ? './dist/rendertree.wasm' : './assets/rendertree.wasm';

    logger.debug('Environment detection:', { isDevelopment });
    logger.info(`Loading WebAssembly from: ${wasmPath}`);

    const fetchResponse = await fetch(wasmPath);
    if (!fetchResponse.ok) {
      const errorMsg = `Failed to fetch WASM file: ${fetchResponse.status} ${fetchResponse.statusText}`;
      logger.error(errorMsg);
      throw new WasmInitializationError(errorMsg);
    }

    const result = await WebAssembly.instantiateStreaming(fetchResponse, go.importObject);
    void go.run(result.instance);

    cachedWasmFunctions = { renderASCII, renderMermaid };
    logger.info('WASM initialization completed successfully');
    return cachedWasmFunctions;
  } catch (e) {
    initPromise = null;
    const { message, originalError } = extractErrorInfo(e);
    logger.error('Error initializing WebAssembly:', message);
    throw new WasmInitializationError(message, originalError);
  }
}

/**
 * Render ASCII representation of query plan
 */
export async function renderASCIITree(
  input: string,
  mode: RenderMode = 'AUTO',
  format: FormatType = 'CURRENT',
  wrapWidth: number = 0,
  hangingIndent: boolean = false,
  appendixOptions: RenderAppendixOptions = {}
): Promise<string> {
  logger.info('renderASCIITree called with mode:', mode, 'format:', format);
  logger.debug('Input length:', input.length, 'characters');

  try {
    const wasmFunctions = await initWasm();
    const params: RenderParams = {
      input,
      mode,
      format,
      wrapWidth,
      hangingIndent,
      ...appendixOptions,
    };
    return invokeWasm(wasmFunctions.renderASCII, JSON.stringify(params));
  } catch (e) {
    const { message, originalError } = extractErrorInfo(e);
    logger.error('Error during rendering:', message);
    throw new WasmRenderingError(message, originalError);
  }
}

/**
 * Render Mermaid.js source for a query plan via WASM.
 */
export async function renderMermaidDiagram(
  input: string,
  options: Omit<RenderMermaidParams, 'input'> = { full: true }
): Promise<string> {
  logger.info('renderMermaidDiagram called');
  logger.debug('Input length:', input.length, 'characters');

  try {
    const wasmFunctions = await initWasm();
    const params: RenderMermaidParams = {
      input,
      ...options,
    };
    return invokeWasm(wasmFunctions.renderMermaid, JSON.stringify(params));
  } catch (e) {
    const { message, originalError } = extractErrorInfo(e);
    logger.error('Error during mermaid rendering:', message);
    throw new WasmRenderingError(message, originalError);
  }
}
