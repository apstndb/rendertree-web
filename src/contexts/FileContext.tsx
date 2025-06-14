import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { logger } from '../utils/logger';

/**
 * Interface for file operation callbacks and methods.
 * Uses callback pattern for clean error handling and state management.
 */
interface FileContextType {
  /**
   * Handles file upload from input element.
   * 
   * @param event - File input change event
   * @param onSuccess - Callback called with file content on successful read
   * @param onError - Callback called with error message on failure
   */
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (content: string) => void,
    onError: (message: string) => void
  ) => void;
  
  /**
   * Loads sample file from public directory.
   * 
   * @param filename - Path to sample file (e.g., "testdata/sample.yaml")
   * @param onSuccess - Callback called with file content on successful load
   * @param onError - Callback called with error message on failure
   * @param onLoading - Callback called with loading message during fetch
   */
  loadSampleFile: (
    filename: string,
    onSuccess: (content: string) => void,
    onError: (message: string) => void,
    onLoading: (message: string) => void
  ) => Promise<void>;
}

/**
 * React context for file operations.
 * Provides methods for file uploads and sample file loading.
 */
const FileContext = createContext<FileContextType | null>(null);

/**
 * Props for the FileProvider component.
 */
interface FileProviderProps {
  children: ReactNode;
}

/**
 * Provider component for file operations.
 * Manages file uploads and sample file loading with proper error handling.
 * 
 * @param children - Child components that will have access to file operations
 * @returns JSX provider element
 */
export const FileProvider: React.FC<FileProviderProps> = ({ children }) => {
  // Handle file upload
  const handleFileUpload = useCallback((
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (content: string) => void,
    onError: (message: string) => void
  ) => {
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
        onError('Could not read file content.');
        return;
      }

      logger.debug(`File content loaded successfully, length: ${content.length} characters`);
      onSuccess(content);
    };

    reader.onerror = () => {
      const errorMsg = reader.error?.message || 'Unknown error';
      logger.error('Error reading file:', errorMsg);
      onError(`Error reading file: ${errorMsg}`);
    };

    logger.debug('Starting to read file as text');
    reader.readAsText(file);
  }, []);

  // Load sample file
  const loadSampleFile = useCallback(async (
    filename: string,
    onSuccess: (content: string) => void,
    onError: (message: string) => void,
    onLoading: (message: string) => void
  ) => {
    logger.debug(`loadSampleFile called with filename: ${filename}`);

    try {
      logger.info(`Fetching sample file: ${filename}`);
      onLoading(`Loading sample file: ${filename}...`);

      const response = await fetch(filename);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${filename}: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();
      logger.debug(`Sample file loaded successfully, length: ${content.length} characters`);

      onSuccess(content);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(`Error loading sample file ${filename}:`, errorMsg);
      onError(`Error loading sample file: ${errorMsg}`);
    }
  }, []);

  const contextValue: FileContextType = {
    handleFileUpload,
    loadSampleFile,
  };

  return (
    <FileContext.Provider value={contextValue}>
      {children}
    </FileContext.Provider>
  );
};

/**
 * Custom hook to access the file operations context.
 * 
 * @returns Object containing:
 *   - handleFileUpload: Function to handle file uploads with callbacks
 *   - loadSampleFile: Function to load sample files with callbacks
 * 
 * @throws Error if used outside of FileProvider
 * 
 * @example
 * ```typescript
 * const { handleFileUpload, loadSampleFile } = useFileContext();
 * 
 * // Handle file upload
 * handleFileUpload(
 *   event,
 *   (content) => setInput(content),
 *   (error) => setMessage(`Upload error: ${error}`)
 * );
 * 
 * // Load sample file
 * await loadSampleFile(
 *   'testdata/sample.yaml',
 *   (content) => setInput(content),
 *   (error) => setMessage(`Load error: ${error}`),
 *   (msg) => setMessage(msg)
 * );
 * ```
 */
export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};