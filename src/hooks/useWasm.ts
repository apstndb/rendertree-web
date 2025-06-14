import { useState, useEffect, useRef } from 'react';
import { initWasm as initWasmOriginal } from '../wasm';
import { logger } from '../utils/logger';
import { extractErrorInfo } from '../utils/errorHandling';

export function useWasm() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const wasmInstance = useRef<Awaited<ReturnType<typeof initWasmOriginal>> | null>(null);

  // Log initial state
  logger.debug('useWasm hook initialized, isLoading:', isLoading);

  useEffect(() => {
    logger.info('Starting WASM initialization in useWasm hook');

    const initWasm = async () => {
      try {
        logger.debug('Calling initWasm from useWasm hook');
        const startTime = performance.now();

        wasmInstance.current = await initWasmOriginal();

        const endTime = performance.now();
        logger.info(`WASM initialization completed in ${(endTime - startTime).toFixed(2)}ms`);

        logger.debug('Setting isLoading to false');
        setIsLoading(false);
      } catch (err) {
        const { message, originalError } = extractErrorInfo(err);
        logger.error('Error in useWasm hook during initialization:', message);

        setError(originalError || new Error(message));
        logger.debug('Setting isLoading to false after error');
        setIsLoading(false);
      }
    };

    initWasm();

    // Cleanup function
    return () => {
      logger.debug('useWasm hook cleanup');
    };
  }, []);

  // Log when renderASCII becomes available
  useEffect(() => {
    if (wasmInstance.current?.renderASCII) {
      logger.info('renderASCII function is now available');
    }
  }, [wasmInstance.current?.renderASCII]);

  // Log state changes
  useEffect(() => {
    logger.debug('useWasm state updated - isLoading:', isLoading, 'hasError:', !!error);
  }, [isLoading, error]);

  return { 
    isLoading, 
    error, 
    renderASCII: wasmInstance.current?.renderASCII 
  };
}
