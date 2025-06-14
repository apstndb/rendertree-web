import React, { createContext, useContext, useCallback } from 'react';
import type { ReactNode } from 'react';
import { logger } from '../utils/logger';

interface FileContextType {
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (content: string) => void,
    onError: (message: string) => void
  ) => void;
  loadSampleFile: (
    filename: string,
    onSuccess: (content: string) => void,
    onError: (message: string) => void,
    onLoading: (message: string) => void
  ) => Promise<void>;
}

const FileContext = createContext<FileContextType | null>(null);

interface FileProviderProps {
  children: ReactNode;
}

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

export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
};