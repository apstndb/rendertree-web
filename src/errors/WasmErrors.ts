export class WasmInitializationError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(`WASM initialization failed: ${message}`);
    this.name = 'WasmInitializationError';
  }
}

export class WasmRenderingError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(`WASM rendering failed: ${message}`);
    this.name = 'WasmRenderingError';
  }
}