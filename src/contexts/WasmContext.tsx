import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { useWasm } from '../hooks/useWasm';

// Define the type for the context value
type WasmContextType = ReturnType<typeof useWasm>;

// Create the context with a default value of null
const WasmContext = createContext<WasmContextType | null>(null);

// Props for the WasmProvider component
interface WasmProviderProps {
  children: ReactNode;
}

// Provider component that wraps the application
export const WasmProvider: React.FC<WasmProviderProps> = ({ children }) => {
  const wasmState = useWasm();

  return (
    <WasmContext.Provider value={wasmState}>
      {children}
    </WasmContext.Provider>
  );
};

// Custom hook to use the WASM context
export const useWasmContext = () => {
  const context = useContext(WasmContext);
  if (!context) {
    throw new Error('useWasmContext must be used within a WasmProvider');
  }
  return context;
};
