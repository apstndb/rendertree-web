import log from 'loglevel';

// Set the default log level based on the environment
// Use import.meta.env for Vite compatibility
const isProduction = import.meta.env.PROD;
const isDevelopment = import.meta.env.DEV;

log.setLevel(isProduction ? log.levels.WARN : log.levels.DEBUG);

// Type for logger arguments - allows primitives, objects, and arrays
// This is more specific than 'unknown[]' and provides better type safety
// while still allowing all common loggable types including Error objects
type LogArgument = string | number | boolean | null | undefined | object | Error;

// Create a wrapper to maintain the same interface as the previous logger
// This ensures compatibility with existing code
export const logger = {
  debug: (message: string, ...args: LogArgument[]): void => {
    // Only log debug messages in development
    if (isDevelopment) {
      if (args.length > 0) {
        log.debug(`[DEBUG] ${message}`, ...args);
      } else {
        log.debug(`[DEBUG] ${message}`);
      }
    }
  },
  info: (message: string, ...args: LogArgument[]): void => {
    if (args.length > 0) {
      log.info(`[INFO] ${message}`, ...args);
    } else {
      log.info(`[INFO] ${message}`);
    }
  },
  warn: (message: string, ...args: LogArgument[]): void => {
    if (args.length > 0) {
      log.warn(`[WARN] ${message}`, ...args);
    } else {
      log.warn(`[WARN] ${message}`);
    }
  },
  error: (message: string, ...args: LogArgument[]): void => {
    if (args.length > 0) {
      log.error(`[ERROR] ${message}`, ...args);
    } else {
      log.error(`[ERROR] ${message}`);
    }
  }
};
