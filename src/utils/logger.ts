import log from 'loglevel';

// Set the default log level based on the environment
log.setLevel(process.env.NODE_ENV === 'production' ? log.levels.INFO : log.levels.DEBUG);

// Create a wrapper to maintain the same interface as the previous logger
// This ensures compatibility with existing code
export const logger = {
  debug: (message: string, ...args: unknown[]): void => {
    if (args.length > 0) {
      log.debug(`[DEBUG] ${message}`, ...args);
    } else {
      log.debug(`[DEBUG] ${message}`);
    }
  },
  info: (message: string, ...args: unknown[]): void => {
    if (args.length > 0) {
      log.info(`[INFO] ${message}`, ...args);
    } else {
      log.info(`[INFO] ${message}`);
    }
  },
  warn: (message: string, ...args: unknown[]): void => {
    if (args.length > 0) {
      log.warn(`[WARN] ${message}`, ...args);
    } else {
      log.warn(`[WARN] ${message}`);
    }
  },
  error: (message: string, ...args: unknown[]): void => {
    if (args.length > 0) {
      log.error(`[ERROR] ${message}`, ...args);
    } else {
      log.error(`[ERROR] ${message}`);
    }
  }
};
