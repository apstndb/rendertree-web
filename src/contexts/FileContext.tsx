import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { createContextWithHook } from '../utils/createContextWithHook';
import { logger } from '../utils/logger';

/**
 * Configuration for file validation rules.
 */
const FILE_VALIDATION_CONFIG = {
  // Maximum file size in bytes (5MB)
  maxSize: 5 * 1024 * 1024,
  // Allowed file extensions
  allowedExtensions: ['.yaml', '.yml', '.json'],
  // Allowed MIME types
  allowedMimeTypes: [
    'application/x-yaml',
    'application/yaml', 
    'text/yaml',
    'text/x-yaml',
    'application/json',
    'text/json',
    'text/plain' // Many YAML files are served as text/plain
  ]
};

/**
 * Validates uploaded file against security and format requirements.
 * 
 * @param file - File to validate
 * @returns Error message if validation fails, null if valid
 */
function validateFile(file: File): string | null {
  // File size validation
  if (file.size > FILE_VALIDATION_CONFIG.maxSize) {
    const maxSizeMB = (FILE_VALIDATION_CONFIG.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
  }

  // File extension validation
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!FILE_VALIDATION_CONFIG.allowedExtensions.includes(fileExtension)) {
    return `File type '${fileExtension}' not supported. Allowed types: ${FILE_VALIDATION_CONFIG.allowedExtensions.join(', ')}`;
  }

  // MIME type validation (if available)
  if (file.type && !FILE_VALIDATION_CONFIG.allowedMimeTypes.includes(file.type)) {
    logger.warn(`Unexpected MIME type '${file.type}' for file '${file.name}'. Proceeding with extension-based validation.`);
  }

  // Empty file check
  if (file.size === 0) {
    return 'File is empty';
  }

  return null; // File is valid
}

/**
 * Validates file content to ensure it's a valid query plan format.
 * 
 * @param content - File content to validate
 * @param filename - Original filename for error messages
 * @returns Error message if validation fails, null if valid
 */
function validateFileContent(content: string, filename: string): string | null {
  // Check if content is empty or only whitespace
  if (!content.trim()) {
    return 'File content is empty';
  }

  // Basic size check for content (prevent extremely large files from causing issues)
  if (content.length > 10 * 1024 * 1024) { // 10MB text limit
    return 'File content is too large to process';
  }

  // Try to detect if it's valid YAML/JSON based on file extension
  const fileExtension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  if (fileExtension === '.json') {
    try {
      JSON.parse(content);
    } catch {
      return 'File does not contain valid JSON';
    }
  }

  // For YAML files, we do basic validation without parsing
  // (since we don't have a YAML parser in the frontend)
  if (['.yaml', '.yml'].includes(fileExtension)) {
    // Check for common YAML structure indicators
    const hasYamlStructure = /^[a-zA-Z_].*:/m.test(content) || content.includes('- ');
    if (!hasYamlStructure) {
      logger.warn(`YAML file '${filename}' does not appear to have YAML structure, but proceeding`);
    }
  }

  return null; // Content is valid
}

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

// Create context with generic utility
const { Provider: FileContextProvider, useContext: useFileContext } = 
  createContextWithHook<FileContextType>('FileContext');

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

    // File validation
    const validationError = validateFile(file);
    if (validationError) {
      logger.error('File validation failed:', validationError);
      onError(validationError);
      return;
    }

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
      
      // Content validation
      const contentValidationError = validateFileContent(content, file.name);
      if (contentValidationError) {
        logger.error('Content validation failed:', contentValidationError);
        onError(contentValidationError);
        return;
      }

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
    <FileContextProvider value={contextValue}>
      {children}
    </FileContextProvider>
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
export { useFileContext };