import { describe, it, expect } from 'vitest';
import type { RenderMode, FormatType, RenderParams, WasmFunctions } from '../wasm';

describe('WASM types', () => {
  it('should have correct RenderMode values', () => {
    const modes: RenderMode[] = ['AUTO', 'PLAN', 'PROFILE'];
    
    // Type assertion to ensure all values are valid
    modes.forEach(mode => {
      expect(['AUTO', 'PLAN', 'PROFILE']).toContain(mode);
    });
  });

  it('should have correct FormatType values', () => {
    const formats: FormatType[] = ['CURRENT', 'TRADITIONAL', 'COMPACT'];
    
    // Type assertion to ensure all values are valid
    formats.forEach(format => {
      expect(['CURRENT', 'TRADITIONAL', 'COMPACT']).toContain(format);
    });
  });

  it('should create valid RenderParams object', () => {
    const params: RenderParams = {
      input: 'test input',
      mode: 'AUTO',
      format: 'CURRENT',
      wrapWidth: 80,
    };
    
    expect(params.input).toBe('test input');
    expect(params.mode).toBe('AUTO');
    expect(params.format).toBe('CURRENT');
    expect(params.wrapWidth).toBe(80);
  });

  it('should create valid WasmFunctions object', () => {
    const mockRenderASCII = (paramsJson: string): string => {
      const params = JSON.parse(paramsJson);
      return `Rendered: ${params.input}`;
    };

    const wasmFunctions: WasmFunctions = {
      renderASCII: mockRenderASCII,
    };
    
    expect(typeof wasmFunctions.renderASCII).toBe('function');
    
    const testParams = JSON.stringify({
      input: 'test',
      mode: 'AUTO',
      format: 'CURRENT',
      wrapWidth: 0,
    });
    
    const result = wasmFunctions.renderASCII(testParams);
    expect(result).toBe('Rendered: test');
  });

  it('should handle different combinations of RenderParams', () => {
    const testCases: RenderParams[] = [
      {
        input: 'query plan',
        mode: 'PLAN',
        format: 'TRADITIONAL',
        wrapWidth: 100,
      },
      {
        input: 'profile data',
        mode: 'PROFILE',
        format: 'COMPACT',
        wrapWidth: 0,
      },
      {
        input: 'auto detect',
        mode: 'AUTO',
        format: 'CURRENT',
        wrapWidth: 120,
      },
    ];

    testCases.forEach(params => {
      expect(params.input).toBeTruthy();
      expect(['AUTO', 'PLAN', 'PROFILE']).toContain(params.mode);
      expect(['CURRENT', 'TRADITIONAL', 'COMPACT']).toContain(params.format);
      expect(typeof params.wrapWidth).toBe('number');
      expect(params.wrapWidth).toBeGreaterThanOrEqual(0);
    });
  });
});