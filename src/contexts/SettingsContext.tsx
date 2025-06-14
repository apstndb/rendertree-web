import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';

interface SettingsState {
  fontSize: number;
}

interface SettingsContextType extends SettingsState {
  setFontSize: (fontSize: number) => void;
}

// Create context with generic utility
const { Provider: SettingsContextProvider, useContext: useSettingsContext } = 
  createContextWithHook<SettingsContextType>('SettingsContext');

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [fontSize, setFontSize] = useState<number>(14);

  // Initialize font size from localStorage
  useEffect(() => {
    const storedSize = localStorage.getItem('rendertree-font-size');
    if (storedSize) {
      setFontSize(parseInt(storedSize, 10));
    }
  }, []);

  // Save font size to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('rendertree-font-size', fontSize.toString());
  }, [fontSize]);

  const contextValue: SettingsContextType = {
    fontSize,
    setFontSize,
  };

  return (
    <SettingsContextProvider value={contextValue}>
      {children}
    </SettingsContextProvider>
  );
};

export { useSettingsContext };