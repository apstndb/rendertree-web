import { useState, useEffect, useRef } from 'react';
import { initWasm as initWasmOriginal } from '../wasm';

export function useWasm() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const wasmInstance = useRef<Awaited<ReturnType<typeof initWasmOriginal>> | null>(null);

  useEffect(() => {
    const initWasm = async () => {
      try {
        wasmInstance.current = await initWasmOriginal();
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      }
    };

    initWasm();
  }, []);

  return { 
    isLoading, 
    error, 
    renderASCII: wasmInstance.current?.renderASCII 
  };
}
