/**
 * Generic utility to create React Context with custom hook
 * 
 * This utility eliminates boilerplate code that's repeated across all context files.
 * It provides consistent error handling and reduces maintenance overhead.
 * 
 * @param contextName - Name of the context (e.g., 'AppContext', 'WasmContext')
 * @returns Object with Provider component and useContext hook
 */

import React, { createContext, useContext as useReactContext } from 'react';

export function createContextWithHook<T>(contextName: string) {
  const Context = createContext<T | undefined>(undefined);
  
  /**
   * Custom hook to access context value with error checking
   * Throws an error if used outside of the corresponding Provider
   */
  const useContext = (): T => {
    const context = useReactContext(Context);
    if (context === undefined) {
      throw new Error(`use${contextName} must be used within a ${contextName}Provider`);
    }
    return context;
  };
  
  /**
   * Generic Provider component that accepts value as prop
   * This allows the actual context implementation to remain in the specific context files
   */
  const Provider = ({ children, value }: { children: React.ReactNode; value: T }) => {
    return React.createElement(Context.Provider, { value }, children);
  };
  
  return { Provider, useContext };
}

/**
 * Example usage:
 * 
 * ```typescript
 * // In your context file (e.g., AppContext.tsx)
 * const { Provider: AppContextProvider, useContext: useAppContext } = 
 *   createContextWithHook<AppContextType>('AppContext');
 * 
 * export function AppProvider({ children }: { children: React.ReactNode }) {
 *   // Your context state logic here
 *   const contextValue = {
 *     // ... your context state
 *   };
 *   
 *   return (
 *     <AppContextProvider value={contextValue}>
 *       {children}
 *     </AppContextProvider>
 *   );
 * }
 * 
 * export { useAppContext };
 * ```
 */