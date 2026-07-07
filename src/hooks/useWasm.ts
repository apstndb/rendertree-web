import { useState, useEffect } from 'react';
import { initWasm as initWasmOriginal } from '../wasm';
import type { WasmFunctions } from '../types/wasm';
import { logger } from '../utils/logger';
import { extractErrorInfo } from '../utils/errorHandling';

export function useWasm() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [wasmFunctions, setWasmFunctions] = useState<WasmFunctions | null>(null);

  logger.debug('useWasm hook initialized, isLoading:', isLoading);

  useEffect(() => {
    logger.info('Starting WASM initialization in useWasm hook');
    let active = true;

    const initialize = async () => {
      try {
        logger.debug('Calling initWasm from useWasm hook');
        const startTime = performance.now();
        const wasm = await initWasmOriginal();
        if (!active) {
          return;
        }

        setWasmFunctions(wasm);
        logger.info(`WASM initialization completed in ${(performance.now() - startTime).toFixed(2)}ms`);
        setIsLoading(false);
      } catch (err) {
        if (!active) {
          return;
        }
        const { message, originalError } = extractErrorInfo(err);
        logger.error('Error in useWasm hook during initialization:', message);
        setError(originalError || new Error(message));
        setIsLoading(false);
      }
    };

    void initialize();

    return () => {
      active = false;
      logger.debug('useWasm hook cleanup');
    };
  }, []);

  useEffect(() => {
    if (wasmFunctions?.renderASCII) {
      logger.info('renderASCII function is now available');
    }
    if (wasmFunctions?.renderMermaid) {
      logger.info('renderMermaid function is now available');
    }
    if (wasmFunctions?.renderDOT) {
      logger.info('renderDOT function is now available');
    }
  }, [wasmFunctions]);

  useEffect(() => {
    logger.debug('useWasm state updated - isLoading:', isLoading, 'hasError:', !!error);
  }, [isLoading, error]);

  return {
    isLoading,
    error,
    renderASCII: wasmFunctions?.renderASCII ?? null,
    renderMermaid: wasmFunctions?.renderMermaid ?? null,
    renderDOT: wasmFunctions?.renderDOT ?? null,
  };
}
