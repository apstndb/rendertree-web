import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useWasmContext } from './WasmContext';

// Define types for the application state
interface AppState {
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
interface AppContextType extends AppState {
  setInput: (input: string) => void;
  setRenderType: (renderType: string) => void;
  setRenderMode: (renderMode: string) => void;
  setFormat: (format: string) => void;
  setWrapWidth: (wrapWidth: number) => void;
  setFontSize: (fontSize: number) => void;
  handleRender: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Create the context with a default value of null
const AppContext = createContext<AppContextType | null>(null);

// Props for the AppProvider component
interface AppProviderProps {
  children: ReactNode;
}

// Provider component that wraps the application
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Application state
  const [input, setInput] = useState<string>('');
  const [renderType, setRenderType] = useState<string>('ascii');
  const [renderMode, setRenderMode] = useState<string>('AUTO');
  const [format, setFormat] = useState<string>('CURRENT');
  const [wrapWidth, setWrapWidth] = useState<number>(0);
  const [output, setOutput] = useState<string>('');
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('Loading rendering engine... Please wait.');
  const [fontSize, setFontSize] = useState<number>(14);

  // Get WASM functionality from context
  const { isLoading, error, renderASCII } = useWasmContext();

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

  // Update message based on WASM loading state
  useEffect(() => {
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else if (!isLoading) {
      setMessage('Ready. Please enter a query plan and click Render.');
    }
  }, [isLoading, error]);

  // Handle rendering
  const handleRender = useCallback(async () => {
    if (!input.trim()) {
      setMessage('Please provide input for the query plan.');
      return;
    }

    if (!renderASCII) {
      setMessage('Rendering engine not initialized.');
      return;
    }

    setIsRendering(true);
    setMessage('Rendering...');

    try {
      const params = {
        input,
        mode: renderMode,
        format,
        wrapWidth
      };

      const result = renderASCII(JSON.stringify(params));
      setOutput(result);
      setMessage('');
    } catch (error) {
      console.error('Error during rendering:', error);
      setMessage(`Error during rendering: ${error}`);
    } finally {
      setIsRendering(false);
    }
  }, [input, renderMode, format, wrapWidth, renderASCII]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No file selected');
      return;
    }

    const file = files[0];
    if (!file) {
      console.log('No file selected, or file is not accessible.');
      return;
    }

    console.log(`File selected: ${file.name}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        console.error('Empty or invalid file content');
        setMessage('Error: Could not read file content.');
        return;
      }

      setInput(content);
      handleRender();
    };

    reader.onerror = () => {
      console.error('Error reading file:', reader.error);
      setMessage(`Error reading file: ${reader.error?.message || 'Unknown error'}`);
    };

    reader.readAsText(file);
  }, [handleRender]);

  // Context value
  const contextValue: AppContextType = {
    input,
    setInput,
    renderType,
    setRenderType,
    renderMode,
    setRenderMode,
    format,
    setFormat,
    wrapWidth,
    setWrapWidth,
    fontSize,
    setFontSize,
    output,
    message,
    isRendering,
    handleRender,
    handleFileUpload
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
