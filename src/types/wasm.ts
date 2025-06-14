/**
 * Rendering mode for query plan visualization
 * - AUTO: Automatically choose between PLAN and PROFILE based on data
 * - PLAN: Show only plan structure without execution statistics  
 * - PROFILE: Show execution statistics and performance data
 */
export type RenderMode = "AUTO" | "PLAN" | "PROFILE";

/**
 * Output format for rendered query plan
 * - CURRENT: Modern format with improved readability
 * - TRADITIONAL: Classic format for compatibility
 * - COMPACT: Dense format for large plans
 */
export type FormatType = "CURRENT" | "TRADITIONAL" | "COMPACT";

/**
 * Parameters for WASM renderASCII function
 */
export interface RenderParams { 
  /** Query plan text in YAML or JSON format */
  input: string; 
  /** Rendering mode */
  mode: RenderMode; 
  /** Output format */
  format: FormatType; 
  /** Text wrapping width (0 = no wrap) */
  wrapWidth: number; 
}

/**
 * Error types returned from WASM renderASCII function
 * These correspond to custom error types in the Go implementation
 */
export type WasmErrorType = 
  /** JSON/YAML parsing failures */
  | "PARSE_ERROR" 
  /** Invalid Spanner query plan format or structure */
  | "INVALID_SPANNER_FORMAT" 
  /** General rendering failures */
  | "RENDER_ERROR" 
  /** Invalid function parameters */
  | "INVALID_PARAMETERS";

/**
 * Structured error response from WASM
 */
export interface WasmError {
  /** Error classification type */
  type: WasmErrorType;
  /** Human-readable error message */
  message: string;
  /** Optional additional error details */
  details?: string;
}

/**
 * Response structure from WASM renderASCII function
 * Replaces direct error throwing with structured error handling
 */
export interface WasmResponse {
  /** Whether the operation succeeded */
  success: boolean;
  /** Rendered ASCII output (only present on success) */
  result?: string;
  /** Error details (only present on failure) */
  error?: WasmError;
}

/**
 * Interface for WASM functions exposed from Go
 * The renderASCII function now returns structured JSON responses
 * instead of throwing JavaScript errors directly
 */
export interface WasmFunctions { 
  /**
   * Renders Spanner query plan as ASCII tree
   * @param paramsJson - JSON string containing RenderParams
   * @returns JSON string containing WasmResponse
   */
  renderASCII: (paramsJson: string) => string; 
}
