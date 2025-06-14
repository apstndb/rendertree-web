import { describe, it, expect } from 'vitest';
import { extractErrorInfo, createErrorMessage } from '../errorHandling';

describe('extractErrorInfo', () => {
  it('should extract message from Error instance', () => {
    const error = new Error('Test error message');
    const result = extractErrorInfo(error);
    
    expect(result).toEqual({
      message: 'Test error message',
      isError: true,
      originalError: error,
    });
  });

  it('should handle string error', () => {
    const error = 'String error message';
    const result = extractErrorInfo(error);
    
    expect(result).toEqual({
      message: 'String error message',
      isError: false,
    });
  });

  it('should handle object with message property', () => {
    const error = { message: 'Object error message', code: 500 };
    const result = extractErrorInfo(error);
    
    expect(result).toEqual({
      message: 'Object error message',
      isError: false,
    });
  });

  it('should handle null error', () => {
    const result = extractErrorInfo(null);
    
    expect(result).toEqual({
      message: 'null',
      isError: false,
    });
  });

  it('should handle undefined error', () => {
    const result = extractErrorInfo(undefined);
    
    expect(result).toEqual({
      message: 'undefined',
      isError: false,
    });
  });

  it('should handle number error', () => {
    const result = extractErrorInfo(404);
    
    expect(result).toEqual({
      message: '404',
      isError: false,
    });
  });

  it('should handle boolean error', () => {
    const result = extractErrorInfo(false);
    
    expect(result).toEqual({
      message: 'false',
      isError: false,
    });
  });

  it('should handle object without message property', () => {
    const error = { code: 500, details: 'Server error' };
    const result = extractErrorInfo(error);
    
    expect(result).toEqual({
      message: '[object Object]',
      isError: false,
    });
  });
});

describe('createErrorMessage', () => {
  it('should create formatted error message for Error instance', () => {
    const error = new Error('Test error');
    const result = createErrorMessage('API call', error);
    
    expect(result).toBe('API call: Test error');
  });

  it('should create formatted error message for non-Error object', () => {
    const error = 'String error';
    const result = createErrorMessage('Validation', error);
    
    expect(result).toBe('Validation: String error (non-Error object)');
  });

  it('should create formatted error message for object with message', () => {
    const error = { message: 'Custom error', code: 400 };
    const result = createErrorMessage('Request', error);
    
    expect(result).toBe('Request: Custom error (non-Error object)');
  });

  it('should handle null error', () => {
    const result = createErrorMessage('Operation', null);
    
    expect(result).toBe('Operation: null (non-Error object)');
  });
});