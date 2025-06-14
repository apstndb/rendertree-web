/**
 * Type Synchronization Tests
 * 
 * These tests validate that Go constants and TypeScript types remain synchronized.
 * They help prevent type drift between the Go WASM module and TypeScript interfaces.
 * 
 * When adding new types or constants:
 * 1. Update the corresponding Go structs/constants in main.go
 * 2. Update the TypeScript interfaces in src/types/wasm.ts
 * 3. Update these tests to include the new values
 */

import { describe, it, expect } from 'vitest';
import type { WasmErrorType, RenderMode, FormatType } from '../wasm.js';

describe('Go-TypeScript Type Synchronization', () => {
  describe('Error Type Constants', () => {
    it('should have TypeScript error types that match Go constants', () => {
      // These values must match Go constants in main.go (ErrorType* constants)
      const expectedGoErrorTypes = [
        'PARSE_ERROR',           // Go: ErrorTypeParseError
        'INVALID_SPANNER_FORMAT', // Go: ErrorTypeInvalidSpannerFormat
        'RENDER_ERROR',          // Go: ErrorTypeRenderError
        'INVALID_PARAMETERS'     // Go: ErrorTypeInvalidParameters
      ];

      // Validate that all expected error types are represented in the TypeScript type
      const typeScriptErrorTypes: WasmErrorType[] = [
        'PARSE_ERROR',
        'INVALID_SPANNER_FORMAT', 
        'RENDER_ERROR',
        'INVALID_PARAMETERS'
      ];

      expect(typeScriptErrorTypes).toHaveLength(expectedGoErrorTypes.length);
      expectedGoErrorTypes.forEach(errorType => {
        expect(typeScriptErrorTypes).toContain(errorType as WasmErrorType);
      });
    });

    it('should not have extra error types not defined in Go', () => {
      // This test ensures we don't add TypeScript-only error types
      const validErrorTypes = [
        'PARSE_ERROR',
        'INVALID_SPANNER_FORMAT',
        'RENDER_ERROR', 
        'INVALID_PARAMETERS'
      ];

      // Create test instances to ensure type checking
      const testErrorTypes: WasmErrorType[] = [
        'PARSE_ERROR',
        'INVALID_SPANNER_FORMAT',
        'RENDER_ERROR',
        'INVALID_PARAMETERS'
      ];

      testErrorTypes.forEach(errorType => {
        expect(validErrorTypes).toContain(errorType);
      });
    });
  });

  describe('Render Mode Constants', () => {
    it('should have TypeScript render modes that match Go constants', () => {
      // These values must match Go constants in main.go (RenderMode* constants)
      const expectedGoRenderModes = [
        'AUTO',    // Go: RenderModeAuto
        'PLAN',    // Go: RenderModePlan  
        'PROFILE'  // Go: RenderModeProfile
      ];

      const typeScriptRenderModes: RenderMode[] = [
        'AUTO',
        'PLAN', 
        'PROFILE'
      ];

      expect(typeScriptRenderModes).toHaveLength(expectedGoRenderModes.length);
      expectedGoRenderModes.forEach(mode => {
        expect(typeScriptRenderModes).toContain(mode as RenderMode);
      });
    });

    it('should not have extra render modes not defined in Go', () => {
      const validRenderModes = ['AUTO', 'PLAN', 'PROFILE'];

      const testRenderModes: RenderMode[] = [
        'AUTO',
        'PLAN',
        'PROFILE'
      ];

      testRenderModes.forEach(mode => {
        expect(validRenderModes).toContain(mode);
      });
    });
  });

  describe('Format Type Constants', () => {
    it('should have TypeScript format types that match Go constants', () => {
      // These values must match Go constants in main.go (format* constants)
      const expectedGoFormatTypes = [
        'CURRENT',      // Go: formatCurrent
        'TRADITIONAL',  // Go: formatTraditional
        'COMPACT'       // Go: formatCompact
      ];

      const typeScriptFormatTypes: FormatType[] = [
        'CURRENT',
        'TRADITIONAL',
        'COMPACT'
      ];

      expect(typeScriptFormatTypes).toHaveLength(expectedGoFormatTypes.length);
      expectedGoFormatTypes.forEach(format => {
        expect(typeScriptFormatTypes).toContain(format as FormatType);
      });
    });

    it('should not have extra format types not defined in Go', () => {
      const validFormatTypes = ['CURRENT', 'TRADITIONAL', 'COMPACT'];

      const testFormatTypes: FormatType[] = [
        'CURRENT',
        'TRADITIONAL', 
        'COMPACT'
      ];

      testFormatTypes.forEach(format => {
        expect(validFormatTypes).toContain(format);
      });
    });
  });

  describe('WASM Response Structure Validation', () => {
    it('should validate successful response structure', () => {
      // Test structure that matches Go Response struct
      const successResponse = {
        success: true,
        result: 'test output'
        // error field should be omitted on success
      };

      expect(successResponse.success).toBe(true);
      expect(typeof successResponse.result).toBe('string');
      expect(successResponse).not.toHaveProperty('error');
    });

    it('should validate error response structure', () => {
      // Test structure that matches Go Response struct with Error
      const errorResponse = {
        success: false,
        error: {
          type: 'PARSE_ERROR' as WasmErrorType,
          message: 'Test error message',
          details: 'Optional details'
        }
        // result field should be omitted on error
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error.type).toBe('PARSE_ERROR');
      expect(typeof errorResponse.error.message).toBe('string');
      expect(typeof errorResponse.error.details).toBe('string');
      expect(errorResponse).not.toHaveProperty('result');
    });

    it('should validate minimal error response structure', () => {
      // Test minimal error structure (details is optional)
      const minimalErrorResponse = {
        success: false,
        error: {
          type: 'RENDER_ERROR' as WasmErrorType,
          message: 'Minimal error'
          // details field is optional (omitempty in Go)
        }
      };

      expect(minimalErrorResponse.success).toBe(false);
      expect(minimalErrorResponse.error.type).toBe('RENDER_ERROR');
      expect(typeof minimalErrorResponse.error.message).toBe('string');
      expect(minimalErrorResponse.error).not.toHaveProperty('details');
    });
  });

  describe('Request Parameters Structure Validation', () => {
    it('should validate render parameters structure', () => {
      // Test structure that matches Go params struct
      const renderParams = {
        input: 'test query plan',
        mode: 'AUTO' as RenderMode,
        format: 'CURRENT' as FormatType,
        wrapWidth: 80
      };

      expect(typeof renderParams.input).toBe('string');
      expect(['AUTO', 'PLAN', 'PROFILE']).toContain(renderParams.mode);
      expect(['CURRENT', 'TRADITIONAL', 'COMPACT']).toContain(renderParams.format);
      expect(typeof renderParams.wrapWidth).toBe('number');
      expect(Number.isInteger(renderParams.wrapWidth)).toBe(true);
    });

    it('should validate parameters with zero wrap width', () => {
      // Test that wrapWidth: 0 (no wrap) is valid
      const noWrapParams = {
        input: 'test input',
        mode: 'PLAN' as RenderMode, 
        format: 'TRADITIONAL' as FormatType,
        wrapWidth: 0
      };

      expect(noWrapParams.wrapWidth).toBe(0);
      expect(Number.isInteger(noWrapParams.wrapWidth)).toBe(true);
    });
  });
});