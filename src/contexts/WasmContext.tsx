import React from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';
import { useWasm } from '../hooks/useWasm';

/**
 * Type definition for the WASM context value.
 * Includes loading state, error state, and the renderASCII function.
 */
type WasmContextType = ReturnType<typeof useWasm>;

// Create context with generic utility
const { Provider: WasmContextProvider, useContext: useWasmContext } = 
  createContextWithHook<WasmContextType>('WasmContext');

/**
 * Props for the WasmProvider component.
 */
interface WasmProviderProps {
  children: ReactNode;
}

/**
 * Provider component that initializes and manages the WebAssembly module.
 * Should wrap the entire application to provide WASM functionality.
 * 
 * @param children - Child components that will have access to WASM context
 * @returns JSX provider element
 */
export const WasmProvider: React.FC<WasmProviderProps> = ({ children }) => {
  const wasmState = useWasm();

  return (
    <WasmContextProvider value={wasmState}>
      {children}
    </WasmContextProvider>
  );
};

/**
 * Custom hook to access the WASM context.
 * 
 * @returns Object containing:
 *   - isLoading: boolean - Whether WASM module is currently loading
 *   - error: Error | null - Any error that occurred during initialization
 *   - renderASCII: function | null - Go function to render ASCII from query plans
 * 
 * @throws Error if used outside of WasmProvider
 * 
 * @example
 * ```typescript
 * const { isLoading, error, renderASCII } = useWasmContext();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorDisplay error={error} />;
 * 
 * if (renderASCII) {
 *   const result = renderASCII(JSON.stringify(params));
 * }
 * ```
 */
export { useWasmContext };
