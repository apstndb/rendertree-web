import { useContext } from 'react';
import { WasmContext } from '../contexts/WasmContextDefinition';

// Custom hook to use the WASM context
export const useWasmContext = () => {
  const context = useContext(WasmContext);
  if (!context) {
    throw new Error('useWasmContext must be used within a WasmProvider');
  }
  return context;
};
