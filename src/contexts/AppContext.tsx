import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useWasmContext } from './WasmContext';
import { logger } from '../utils/logger';

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
    logger.debug('AppContext useEffect triggered - isLoading:', isLoading, 'hasError:', !!error);

    if (error) {
      const errorMsg = `Error: ${error.message}`;
      logger.error('Setting error message in UI:', errorMsg);
      setMessage(errorMsg);
    } else if (!isLoading) {
      logger.info('WASM loading completed, setting ready message in UI');
      setMessage('Ready. Please enter a query plan and click Render.');
    } else {
      logger.debug('Still loading, message remains unchanged');
    }
  }, [isLoading, error]);

  // Handle rendering
  const handleRender = useCallback(async () => {
    logger.debug('handleRender called');

    if (!input.trim()) {
      logger.warn('Render attempted with empty input');
      setMessage('Please provide input for the query plan.');
      return;
    }

    if (!renderASCII) {
      logger.error('Render attempted but renderASCII function is not available');
      setMessage('Rendering engine not initialized.');
      return;
    }

    logger.info('Starting rendering process');
    logger.debug('Setting isRendering to true');
    setIsRendering(true);

    logger.debug('Setting message to "Rendering..."');
    setMessage('Rendering...');

    try {
      const params = {
        input,
        mode: renderMode,
        format,
        wrapWidth
      };

      logger.debug('Rendering with params:', { mode: renderMode, format, wrapWidth, inputLength: input.length });

      const startTime = performance.now();
      const result = renderASCII(JSON.stringify(params));
      const endTime = performance.now();

      logger.info(`Rendering completed in ${(endTime - startTime).toFixed(2)}ms`);
      logger.debug('Result length:', result.length, 'characters');

      logger.debug('Setting output and clearing message');
      setOutput(result);
      setMessage('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('Error during rendering:', errorMsg);
      setMessage(`Error during rendering: ${errorMsg}`);
    } finally {
      logger.debug('Setting isRendering to false');
      setIsRendering(false);
    }
  }, [input, renderMode, format, wrapWidth, renderASCII]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    logger.debug('handleFileUpload called');

    const files = event.target.files;
    if (!files || files.length === 0) {
      logger.warn('No file selected in file upload');
      return;
    }

    const file = files[0];
    if (!file) {
      logger.warn('No file selected, or file is not accessible');
      return;
    }

    logger.info(`File selected for upload: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);

    const reader = new FileReader();
    reader.onload = (e) => {
      logger.debug('FileReader onload event triggered');

      const content = e.target?.result;
      if (typeof content !== 'string') {
        logger.error('Empty or invalid file content from FileReader');
        setMessage('Error: Could not read file content.');
        return;
      }

      logger.debug(`File content loaded successfully, length: ${content.length} characters`);
      setInput(content);

      logger.info('File content loaded into input, triggering render');
      handleRender();
    };

    reader.onerror = () => {
      const errorMsg = reader.error?.message || 'Unknown error';
      logger.error('Error reading file:', errorMsg);
      setMessage(`Error reading file: ${errorMsg}`);
    };

    logger.debug('Starting to read file as text');
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
