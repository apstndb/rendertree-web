import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface SettingsState {
  fontSize: number;
}

interface SettingsContextType extends SettingsState {
  setFontSize: (fontSize: number) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

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
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
};