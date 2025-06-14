import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useWasm } from '../hooks/useWasm';

/**
 * Type definition for the WASM context value.
 * Includes loading state, error state, and the renderASCII function.
 */
type WasmContextType = ReturnType<typeof useWasm>;

/**
 * React context for WebAssembly state management.
 * Provides access to WASM loading state and Go functions.
 */
const WasmContext = createContext<WasmContextType | null>(null);

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
    <WasmContext.Provider value={wasmState}>
      {children}
    </WasmContext.Provider>
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
export const useWasmContext = () => {
  const context = useContext(WasmContext);
  if (!context) {
    throw new Error('useWasmContext must be used within a WasmProvider');
  }
  return context;
};
