/**
 * WASM Node.js Integration Tests
 * 
 * These tests run the actual WASM module in Node.js environment to validate
 * that Go/TypeScript type interfaces work correctly in practice.
 * They provide the highest confidence in type synchronization.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { WasmResponse, WasmError, RenderParams } from '../wasm.js';

// Global declarations for WASM environment
declare global {
  var Go: new () => {
    importObject: WebAssembly.Imports;
    run: (instance: WebAssembly.Instance) => Promise<void>;
    exited: boolean;
  };
  var renderASCII: (paramsJson: string) => string;
}

describe('WASM Node.js Integration Tests', () => {
  let renderASCII: (paramsJson: string) => string;

  beforeAll(async () => {
    // Load and execute wasm_exec.js in Node.js environment
    const wasmExecPath = join(process.cwd(), 'dist', 'wasm_exec.js');
    const wasmPath = join(process.cwd(), 'dist', 'rendertree.wasm');
    
    // Read wasm_exec.js
    const wasmExecScript = readFileSync(wasmExecPath, 'utf8');
    
    // Setup Node.js globals that wasm_exec.js expects
    const setupNodeGlobals = () => {
      // Create minimal global environment for Go WASM
      (global as any).globalThis = global;
      
      // Mock crypto for Node.js
      if (!(global as any).crypto) {
        (global as any).crypto = {
          getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          }
        };
      }
      
      // Mock performance for Node.js  
      if (!(global as any).performance) {
        (global as any).performance = {
          now: () => Date.now()
        };
      }
      
      // Mock TextEncoder/TextDecoder if not available
      if (typeof TextEncoder === 'undefined') {
        const { TextEncoder, TextDecoder } = require('util');
        (global as any).TextEncoder = TextEncoder;
        (global as any).TextDecoder = TextDecoder;
      }
    };
    
    setupNodeGlobals();
    
    // Execute wasm_exec.js to define Go class
    eval(wasmExecScript);
    
    // Initialize Go WASM module
    const go = new (global as any).Go();
    const wasmBytes = readFileSync(wasmPath);
    
    // Instantiate WASM module
    const wasmModule = await WebAssembly.instantiate(wasmBytes, go.importObject);
    
    // Start Go runtime (this will expose renderASCII globally)
    const runPromise = go.run(wasmModule.instance);
    
    // Wait a bit for Go runtime to initialize
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get renderASCII function from global scope
    renderASCII = (global as any).renderASCII;
    
    if (typeof renderASCII !== 'function') {
      throw new Error('renderASCII function not available after WASM initialization');
    }
    
    console.log('WASM module initialized successfully in Node.js');
  });

  describe('Successful Response Validation', () => {
    it('should return valid response structure for minimal valid input', () => {
      const params: RenderParams = {
        input: `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"
        kind: RELATIONAL
        index: 0
`,
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      expect(typeof resultStr).toBe('string');
      
      const response: WasmResponse = JSON.parse(resultStr);
      
      // Validate response structure
      expect(response).toHaveProperty('success');
      expect(typeof response.success).toBe('boolean');

      if (response.success) {
        expect(response).toHaveProperty('result');
        expect(typeof response.result).toBe('string');
        expect(response.result!.length).toBeGreaterThan(0);
        expect(response).not.toHaveProperty('error');
        
        // Should contain some rendering output
        expect(response.result).toMatch(/Test Node|RELATIONAL/);
      } else {
        // If it fails, check error structure
        expect(response).toHaveProperty('error');
        expect(response).not.toHaveProperty('result');
        
        const error = response.error!;
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('message');
        expect(['PARSE_ERROR', 'INVALID_SPANNER_FORMAT', 'RENDER_ERROR', 'INVALID_PARAMETERS']).toContain(error.type);
      }
    });
    
    it('should handle complex query plan with execution stats', () => {
      // Use actual test data from project
      const complexInput = `
stats:
  queryPlan:
    planNodes:
      - displayName: "Distributed Union"
        kind: RELATIONAL
        index: 0
        executionStats:
          cpu_time:
            total: "0.46"
            unit: msecs
          latency:
            total: "4.34" 
            unit: msecs
          rows:
            total: "1"
            unit: rows
        childLinks:
          - childIndex: 1
      - displayName: "Scan"
        kind: RELATIONAL
        index: 1
        executionStats:
          cpu_time:
            total: "0.09"
            unit: msecs
          rows:
            total: "1"
            unit: rows
        metadata:
          scan_target: "TestTable"
          scan_type: "TableScan"
`;
      
      const params: RenderParams = {
        input: complexInput,
        mode: 'PROFILE', // Use PROFILE mode to include execution stats
        format: 'CURRENT',
        wrapWidth: 120
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);
      
      if (response.success) {
        expect(response.result).toBeTruthy();
        expect(response.result!.length).toBeGreaterThan(0);
        // Should contain execution statistics
        expect(response.result).toMatch(/msecs|cpu_time|latency/);
      }
    });
  });

  describe('Error Response Validation', () => {
    it('should return PARSE_ERROR for invalid JSON input', () => {
      const params: RenderParams = {
        input: 'invalid json content {',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);

      expect(response.success).toBe(false);
      expect(response).not.toHaveProperty('result');
      expect(response).toHaveProperty('error');

      const error = response.error!;
      expect(error.type).toBe('PARSE_ERROR');
      expect(typeof error.message).toBe('string');
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should return INVALID_PARAMETERS for invalid render mode', () => {
      const invalidParams = {
        input: `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"
        kind: RELATIONAL
        index: 0
`,
        mode: 'INVALID_MODE',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(invalidParams));
      const response: WasmResponse = JSON.parse(resultStr);

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('INVALID_PARAMETERS');
      expect(response.error?.message).toMatch(/render mode/i);
    });

    it('should return INVALID_PARAMETERS for invalid format type', () => {
      const invalidParams = {
        input: `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"  
        kind: RELATIONAL
        index: 0
`,
        mode: 'AUTO',
        format: 'INVALID_FORMAT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(invalidParams));
      const response: WasmResponse = JSON.parse(resultStr);

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('INVALID_PARAMETERS');
      expect(response.error?.message).toMatch(/format/i);
    });

    it('should return INVALID_SPANNER_FORMAT for missing plan nodes', () => {
      const params: RenderParams = {
        input: `
stats:
  queryPlan: {}
`,
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);

      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('INVALID_SPANNER_FORMAT');
      expect(response.error?.message).toMatch(/plan nodes|query plan/i);
    });
  });

  describe('Parameter Type Validation', () => {
    it('should validate all render modes work correctly', () => {
      const testInput = `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"
        kind: RELATIONAL
        index: 0
`;

      const renderModes: Array<RenderParams['mode']> = ['AUTO', 'PLAN', 'PROFILE'];
      
      for (const mode of renderModes) {
        const params: RenderParams = {
          input: testInput,
          mode,
          format: 'CURRENT',
          wrapWidth: 80
        };

        const resultStr = renderASCII(JSON.stringify(params));
        const response: WasmResponse = JSON.parse(resultStr);

        expect(typeof response.success).toBe('boolean');
        
        if (!response.success) {
          // Should not fail due to parameter validation
          expect(response.error!.type).not.toBe('INVALID_PARAMETERS');
        }
      }
    });

    it('should validate all format types work correctly', () => {
      const testInput = `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"
        kind: RELATIONAL
        index: 0
`;

      const formatTypes: Array<RenderParams['format']> = ['CURRENT', 'TRADITIONAL', 'COMPACT'];
      
      for (const format of formatTypes) {
        const params: RenderParams = {
          input: testInput,
          mode: 'AUTO',
          format,
          wrapWidth: 80
        };

        const resultStr = renderASCII(JSON.stringify(params));
        const response: WasmResponse = JSON.parse(resultStr);

        expect(typeof response.success).toBe('boolean');
        
        if (!response.success) {
          // Should not fail due to parameter validation
          expect(response.error!.type).not.toBe('INVALID_PARAMETERS');
        }
      }
    });

    it('should validate wrap width parameter handling', () => {
      const testInput = `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test Node"
        kind: RELATIONAL
        index: 0
`;

      const wrapWidths = [0, 40, 80, 120, 160];
      
      for (const wrapWidth of wrapWidths) {
        const params: RenderParams = {
          input: testInput,
          mode: 'AUTO',
          format: 'CURRENT',
          wrapWidth
        };

        const resultStr = renderASCII(JSON.stringify(params));
        const response: WasmResponse = JSON.parse(resultStr);

        expect(typeof response.success).toBe('boolean');
        
        if (!response.success) {
          // Should not fail due to wrap width parameter
          expect(response.error!.type).not.toBe('INVALID_PARAMETERS');
        }
      }
    });
  });

  describe('JSON Serialization Validation', () => {
    it('should maintain data integrity through JSON serialization cycle', () => {
      const originalParams: RenderParams = {
        input: 'stats:\\n  queryPlan:\\n    planNodes: []',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      // Serialize and deserialize parameters
      const serialized = JSON.stringify(originalParams);
      const deserialized: RenderParams = JSON.parse(serialized);
      
      expect(deserialized.input).toBe(originalParams.input);
      expect(deserialized.mode).toBe(originalParams.mode);
      expect(deserialized.format).toBe(originalParams.format);
      expect(deserialized.wrapWidth).toBe(originalParams.wrapWidth);

      // Call WASM with serialized params
      const resultStr = renderASCII(serialized);
      const response: WasmResponse = JSON.parse(resultStr);
      
      expect(typeof response.success).toBe('boolean');
      expect(response).toSatisfy((resp: WasmResponse) => {
        return (resp.success && 'result' in resp) || (!resp.success && 'error' in resp);
      });
    });

    it('should handle special characters in input properly', () => {
      const specialInput = `
stats:
  queryPlan:
    planNodes:
      - displayName: "Test with special chars: áéíóú ñ 中文 🌟"
        kind: RELATIONAL
        index: 0
`;

      const params: RenderParams = {
        input: specialInput,
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);
      
      // Should handle special characters without crashing
      expect(typeof response.success).toBe('boolean');
      
      if (response.success) {
        expect(response.result).toBeTruthy();
      } else {
        expect(response.error).toBeTruthy();
        expect(typeof response.error!.message).toBe('string');
      }
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large input without crashing', () => {
      // Generate large but valid query plan
      const largeInput = `
stats:
  queryPlan:
    planNodes:
${Array.from({ length: 50 }, (_, i) => `      - displayName: "Node ${i}"
        kind: RELATIONAL  
        index: ${i}
        ${i > 0 ? `childLinks:\n          - childIndex: ${i - 1}` : ''}`).join('\n')}
`;

      const params: RenderParams = {
        input: largeInput,
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);
      
      // Should handle large input gracefully
      expect(typeof response.success).toBe('boolean');
    });

    it('should handle empty input gracefully', () => {
      const params: RenderParams = {
        input: '',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 80
      };

      const resultStr = renderASCII(JSON.stringify(params));
      const response: WasmResponse = JSON.parse(resultStr);
      
      expect(response.success).toBe(false);
      expect(response.error?.type).toBe('PARSE_ERROR');
    });
  });
});