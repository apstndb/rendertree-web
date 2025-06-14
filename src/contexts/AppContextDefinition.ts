import { createContext } from 'react';

// Define types for the application state
export interface AppState {
  input: string;
  renderType: string;
  renderMode: string;
  format: string;
  wrapWidth: number;
  fontSize: number;
  output: string;
  message: string;
  isRendering: boolean;
}

// Define types for the context value
export interface AppContextType extends AppState {
  setInput: (input: string) => void;
  setRenderType: (renderType: string) => void;
  setRenderMode: (renderMode: string) => void;
  setFormat: (format: string) => void;
  setWrapWidth: (wrapWidth: number) => void;
  setFontSize: (fontSize: number) => void;
  handleRender: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loadSampleFile: (filename: string) => Promise<void>;
}

// Create the context with a default value of null
export const AppContext = createContext<AppContextType | null>(null);