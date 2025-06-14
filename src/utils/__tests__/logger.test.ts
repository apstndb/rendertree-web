import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import log from 'loglevel';

// Mock loglevel
vi.mock('loglevel', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    setLevel: vi.fn(),
    levels: {
      WARN: 3,
      DEBUG: 1,
    },
  },
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      PROD: false,
      DEV: true,
    },
  },
});

describe('logger utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with correct log level in development', async () => {
    // Re-import to trigger initialization with mocked environment
    await import('../logger');
    
    expect(log.setLevel).toHaveBeenCalledWith(log.levels.DEBUG);
  });

  it('should log debug messages in development environment', async () => {
    const { logger } = await import('../logger');
    
    logger.debug('test debug message', 'arg1', 123);
    
    expect(log.debug).toHaveBeenCalledWith('[DEBUG] test debug message', 'arg1', 123);
  });

  it('should log debug messages without arguments', async () => {
    const { logger } = await import('../logger');
    
    logger.debug('test debug message');
    
    expect(log.debug).toHaveBeenCalledWith('[DEBUG] test debug message');
  });

  it('should log info messages', async () => {
    const { logger } = await import('../logger');
    
    logger.info('test info message', 'arg1');
    
    expect(log.info).toHaveBeenCalledWith('[INFO] test info message', 'arg1');
  });

  it('should log warn messages', async () => {
    const { logger } = await import('../logger');
    
    logger.warn('test warn message');
    
    expect(log.warn).toHaveBeenCalledWith('[WARN] test warn message');
  });

  it('should log error messages', async () => {
    const { logger } = await import('../logger');
    const error = new Error('test error');
    
    logger.error('test error message', error);
    
    expect(log.error).toHaveBeenCalledWith('[ERROR] test error message', error);
  });

  it('should accept various LogArgument types', async () => {
    const { logger } = await import('../logger');
    const error = new Error('test');
    const obj = { key: 'value' };
    
    // Test all allowed types
    logger.info('test', 'string', 123, true, null, undefined, obj, error);
    
    expect(log.info).toHaveBeenCalledWith(
      '[INFO] test',
      'string',
      123,
      true,
      null,
      undefined,
      obj,
      error
    );
  });
});