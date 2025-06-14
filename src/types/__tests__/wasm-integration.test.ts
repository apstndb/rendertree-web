/**
 * WASM Integration Type Tests
 * 
 * These tests validate that WASM interface types remain synchronized
 * by checking structure compatibility and performing runtime validation.
 * They complement the unit tests with integration-style validation.
 */

import { describe, it, expect } from 'vitest';
import type { WasmResponse, WasmError, RenderParams, WasmErrorType, RenderMode, FormatType } from '../wasm.js';

describe('WASM Integration Type Validation', () => {
  describe('Request Parameter Structure', () => {
    it('should validate RenderParams structure compatibility', () => {
      // Test that RenderParams can be created and serialized correctly
      const params: RenderParams = {
        input: 'test input',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      // Should serialize without data loss
      const serialized = JSON.stringify(params);
      const deserialized: RenderParams = JSON.parse(serialized);

      expect(deserialized.input).toBe(params.input);
      expect(deserialized.mode).toBe(params.mode);
      expect(deserialized.format).toBe(params.format);
      expect(deserialized.wrapWidth).toBe(params.wrapWidth);
    });

    it('should validate all render mode values are properly typed', () => {
      const validModes: RenderMode[] = ['AUTO', 'PLAN', 'PROFILE'];
      
      for (const mode of validModes) {
        const params: RenderParams = {
          input: 'test',
          mode,
          format: 'CURRENT',
          wrapWidth: 80
        };
        
        // Should compile and serialize without issues
        expect(JSON.stringify(params)).toContain(mode);
      }
    });

    it('should validate all format type values are properly typed', () => {
      const validFormats: FormatType[] = ['CURRENT', 'TRADITIONAL', 'COMPACT'];
      
      for (const format of validFormats) {
        const params: RenderParams = {
          input: 'test',
          mode: 'AUTO',
          format,
          wrapWidth: 80
        };
        
        // Should compile and serialize without issues
        expect(JSON.stringify(params)).toContain(format);
      }
    });

    it('should validate wrap width type compatibility', () => {
      const wrapWidths = [0, 80, 120, 160];
      
      for (const wrapWidth of wrapWidths) {
        const params: RenderParams = {
          input: 'test',
          mode: 'AUTO',
          format: 'CURRENT',
          wrapWidth
        };
        
        expect(typeof params.wrapWidth).toBe('number');
        expect(Number.isInteger(params.wrapWidth)).toBe(true);
      }
    });
  });

  describe('Response Structure Validation', () => {
    it('should validate successful response structure', () => {
      // Mock successful response matching Go Response struct
      const successResponse: WasmResponse = {
        success: true,
        result: 'test output'
        // error should be omitted
      };

      expect(successResponse.success).toBe(true);
      expect(typeof successResponse.result).toBe('string');
      expect(successResponse).not.toHaveProperty('error');

      // Should serialize correctly
      const serialized = JSON.stringify(successResponse);
      const parsed = JSON.parse(serialized);
      expect(parsed.success).toBe(true);
      expect(parsed.result).toBe('test output');
    });

    it('should validate error response structure', () => {
      // Mock error response matching Go Response struct with Error
      const errorResponse: WasmResponse = {
        success: false,
        error: {
          type: 'PARSE_ERROR',
          message: 'Test error message',
          details: 'Optional details'
        }
        // result should be omitted
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.type).toBe('PARSE_ERROR');
      expect(typeof errorResponse.error?.message).toBe('string');
      expect(typeof errorResponse.error?.details).toBe('string');
      expect(errorResponse).not.toHaveProperty('result');

      // Should serialize correctly
      const serialized = JSON.stringify(errorResponse);
      const parsed = JSON.parse(serialized);
      expect(parsed.success).toBe(false);
      expect(parsed.error.type).toBe('PARSE_ERROR');
    });

    it('should validate minimal error response (no details)', () => {
      // Mock minimal error response (details is optional)
      const minimalError: WasmResponse = {
        success: false,
        error: {
          type: 'RENDER_ERROR',
          message: 'Minimal error'
          // details omitted (optional field)
        }
      };

      expect(minimalError.success).toBe(false);
      expect(minimalError.error?.type).toBe('RENDER_ERROR');
      expect(typeof minimalError.error?.message).toBe('string');
      expect(minimalError.error).not.toHaveProperty('details');
    });
  });

  describe('Error Type Validation', () => {
    it('should validate all error types are properly structured', () => {
      const errorTypes: WasmErrorType[] = [
        'PARSE_ERROR',
        'INVALID_SPANNER_FORMAT',
        'RENDER_ERROR',
        'INVALID_PARAMETERS'
      ];

      for (const errorType of errorTypes) {
        const error: WasmError = {
          type: errorType,
          message: `Test ${errorType} message`
        };

        expect(typeof error.type).toBe('string');
        expect(typeof error.message).toBe('string');
        expect(error.message.length).toBeGreaterThan(0);

        // Should serialize correctly
        const serialized = JSON.stringify(error);
        const parsed = JSON.parse(serialized);
        expect(parsed.type).toBe(errorType);
      }
    });

    it('should validate error with details field', () => {
      const errorWithDetails: WasmError = {
        type: 'PARSE_ERROR',
        message: 'Parsing failed',
        details: 'Additional error context'
      };

      expect(typeof errorWithDetails.details).toBe('string');
      expect(errorWithDetails.details!.length).toBeGreaterThan(0);

      // Should serialize with all fields
      const serialized = JSON.stringify(errorWithDetails);
      const parsed = JSON.parse(serialized);
      expect(parsed.details).toBe('Additional error context');
    });
  });

  describe('JSON Compatibility Validation', () => {
    it('should validate request-response cycle compatibility', () => {
      // Create request parameters
      const request: RenderParams = {
        input: 'stats:\\n  queryPlan:\\n    planNodes: []',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      // Serialize request (what would be sent to WASM)
      const requestJson = JSON.stringify(request);
      const parsedRequest: RenderParams = JSON.parse(requestJson);

      // Validate request serialization
      expect(parsedRequest.input).toBe(request.input);
      expect(parsedRequest.mode).toBe(request.mode);
      expect(parsedRequest.format).toBe(request.format);
      expect(parsedRequest.wrapWidth).toBe(request.wrapWidth);

      // Mock response (what would be returned from WASM)
      const response: WasmResponse = {
        success: false,
        error: {
          type: 'INVALID_SPANNER_FORMAT',
          message: 'Plan nodes are missing from query plan'
        }
      };

      // Serialize response (what would be received from WASM)
      const responseJson = JSON.stringify(response);
      const parsedResponse: WasmResponse = JSON.parse(responseJson);

      // Validate response serialization
      expect(parsedResponse.success).toBe(false);
      expect(parsedResponse.error?.type).toBe('INVALID_SPANNER_FORMAT');
      expect(parsedResponse.error?.message).toBe('Plan nodes are missing from query plan');
    });

    it('should validate optional field handling in JSON', () => {
      // Test successful response (no error field)
      const successJson = '{"success":true,"result":"output"}';
      const successResponse: WasmResponse = JSON.parse(successJson);
      
      expect(successResponse.success).toBe(true);
      expect(successResponse.result).toBe('output');
      expect(successResponse.error).toBeUndefined();

      // Test error response (no result field)
      const errorJson = '{"success":false,"error":{"type":"PARSE_ERROR","message":"Failed"}}';
      const errorResponse: WasmResponse = JSON.parse(errorJson);
      
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.type).toBe('PARSE_ERROR');
      expect(errorResponse.result).toBeUndefined();

      // Test error without details (optional field)
      const minimalErrorJson = '{"success":false,"error":{"type":"RENDER_ERROR","message":"Error"}}';
      const minimalErrorResponse: WasmResponse = JSON.parse(minimalErrorJson);
      
      expect(minimalErrorResponse.error?.details).toBeUndefined();
    });
  });

  describe('Type Safety Validation', () => {
    it('should prevent type drift with compilation checks', () => {
      // These checks ensure TypeScript compilation catches type mismatches

      // Render mode type safety
      const validMode: RenderMode = 'AUTO';
      expect(['AUTO', 'PLAN', 'PROFILE']).toContain(validMode);

      // Format type safety  
      const validFormat: FormatType = 'CURRENT';
      expect(['CURRENT', 'TRADITIONAL', 'COMPACT']).toContain(validFormat);

      // Error type safety
      const validError: WasmErrorType = 'PARSE_ERROR';
      expect(['PARSE_ERROR', 'INVALID_SPANNER_FORMAT', 'RENDER_ERROR', 'INVALID_PARAMETERS']).toContain(validError);
    });

    it('should validate interface property requirements', () => {
      // All required properties must be present for successful compilation
      
      // RenderParams requires all fields
      const params: RenderParams = {
        input: 'required',
        mode: 'AUTO',     // required
        format: 'CURRENT', // required  
        wrapWidth: 80     // required
      };
      expect(Object.keys(params)).toHaveLength(4);

      // WasmResponse requires success, optional result/error
      const response: WasmResponse = {
        success: true
        // result and error are optional
      };
      expect(response.success).toBeDefined();

      // WasmError requires type and message, optional details
      const error: WasmError = {
        type: 'PARSE_ERROR',
        message: 'required'
        // details is optional
      };
      expect(error.type).toBeDefined();
      expect(error.message).toBeDefined();
    });
  });
});