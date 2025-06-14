type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.debug) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.info) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (logLevels[currentLevel] <= logLevels.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
};