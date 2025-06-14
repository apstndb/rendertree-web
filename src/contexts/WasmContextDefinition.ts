import { createContext } from 'react';
import { useWasm } from '../hooks/useWasm';

// Define the type for the context value
export type WasmContextType = ReturnType<typeof useWasm>;

// Create the context with a default value of null
export const WasmContext = createContext<WasmContextType | null>(null);