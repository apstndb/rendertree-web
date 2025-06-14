export type RenderMode = "AUTO" | "PLAN" | "PROFILE";
export type FormatType = "CURRENT" | "TRADITIONAL" | "COMPACT";

export interface RenderParams { 
  input: string; 
  mode: RenderMode; 
  format: FormatType; 
  wrapWidth: number; 
}

// Error types matching Go constants
export type WasmErrorType = 
  | "PARSE_ERROR" 
  | "INVALID_SPANNER_FORMAT" 
  | "RENDER_ERROR" 
  | "INVALID_PARAMETERS";

// Error structure from WASM
export interface WasmError {
  type: WasmErrorType;
  message: string;
  details?: string;
}

// Response structure from WASM
export interface WasmResponse {
  success: boolean;
  result?: string;
  error?: WasmError;
}

// WASM functions interface (now returns JSON string)
export interface WasmFunctions { 
  renderASCII: (paramsJson: string) => string; 
}
