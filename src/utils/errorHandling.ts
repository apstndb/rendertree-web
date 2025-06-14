/**
 * Utility functions for proper error handling and type safety
 */

/**
 * Safely extracts error message from unknown error type
 * @param error - Unknown error object (unknown is appropriate here as catch blocks and error callbacks can receive any type)
 * @returns Error message string and whether it was an Error instance
 */
export function extractErrorInfo(error: unknown): { message: string; isError: boolean; originalError?: Error } {
  if (error instanceof Error) {
    return {
      message: error.message,
      isError: true,
      originalError: error
    };
  }
  
  if (typeof error === 'string') {
    return {
      message: error,
      isError: false
    };
  }
  
  if (error && typeof error === 'object' && 'message' in error) {
    return {
      message: String(error.message),
      isError: false
    };
  }
  
  return {
    message: String(error),
    isError: false
  };
}

/**
 * Creates a standardized error message with context
 * @param context - Context where the error occurred
 * @param error - The original error (unknown is appropriate here as errors can be any type)
 * @returns Formatted error message
 */
export function createErrorMessage(context: string, error: unknown): string {
  const { message, isError } = extractErrorInfo(error);
  return `${context}: ${message}${isError ? '' : ' (non-Error object)'}`;
}