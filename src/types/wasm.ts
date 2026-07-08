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
 * Appendix sections that can be printed after the rendered tree table
 * - predicates: Predicate-like scalar links
 * - ordering: Ordering scalar links for sort operators
 * - aggregate: Grouping and aggregate scalar links for aggregate operators
 * - typed: All typed scalar links as a raw debug dump
 * - full: All scalar links, including unnamed links, as a raw debug dump
 */
export type PrintSection = "predicates" | "ordering" | "aggregate" | "typed" | "full";

/**
 * Optional appendix rendering settings.
 */
export interface RenderAppendixOptions {
  /** Ordered appendix sections. Omit for default predicates; use [] for no appendices. */
  printSections?: PrintSection[];
  /** Whether semantic appendix sections should include scalar assignment variable names */
  showScalarVars?: boolean;
  /** Whether semantic appendix sections should resolve direct scalar variable aliases */
  resolveScalarVars?: boolean;
  /** Whether semantic appendix sections should recursively resolve scalar variable aliases */
  resolveScalarVarsRecursive?: boolean;
}

/**
 * Output view mode for the visualization panel
 * - ascii: Text tree rendered by spannerplan/plantree
 * - diagram: Mermaid.js diagram rendered in the browser
 * - svg: Graphviz SVG laid out in the browser from spannerplanviz DOT source
 * - d2: D2 (https://d2lang.com) diagram source text; render externally with the d2 CLI
 */
export type OutputView = "ascii" | "diagram" | "svg" | "d2";

/**
 * Parameters for WASM renderMermaid/renderDOT functions
 */
export interface RenderPlanVizParams {
  /** Query plan text in YAML or JSON format */
  input: string;
  /** Enable all diagram detail flags (spannerplanviz --full) */
  full?: boolean;
  metadata?: boolean;
  executionStats?: boolean;
  executionSummary?: boolean;
  serializeResult?: boolean;
  hideScanTarget?: boolean;
  nonVariableScalar?: boolean;
  variableScalar?: boolean;
}

/** @deprecated Use RenderPlanVizParams */
export type RenderMermaidParams = RenderPlanVizParams;

/**
 * Parameters for WASM renderASCII function
 */
export interface RenderParams extends RenderAppendixOptions {
  /** Query plan text in YAML or JSON format */
  input: string; 
  /** Rendering mode */
  mode: RenderMode; 
  /** Output format */
  format: FormatType; 
  /** Text wrapping width (0 = no wrap) */
  wrapWidth: number; 
  /** Whether wrapped lines should align after node-local prefixes such as [Input] or [Map] */
  hangingIndent?: boolean;
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
  /**
   * Renders Spanner query plan as Mermaid.js source
   * @param paramsJson - JSON string containing RenderMermaidParams
   * @returns JSON string containing WasmResponse
   */
  renderMermaid: (paramsJson: string) => string;
  /**
   * Renders Spanner query plan as Graphviz DOT source text
   * (layout to SVG happens in the browser via @hpcc-js/wasm-graphviz)
   * @param paramsJson - JSON string containing RenderPlanVizParams
   * @returns JSON string containing WasmResponse
   */
  renderDOT: (paramsJson: string) => string;
  /**
   * Renders Spanner query plan as D2 (https://d2lang.com) diagram source text.
   * The result is unlaid-out D2 source; render it externally with the d2 CLI
   * (for example `d2 plan.d2 plan.svg`). No in-browser rendering is performed.
   * @param paramsJson - JSON string containing RenderPlanVizParams
   * @returns JSON string containing WasmResponse
   */
  renderD2: (paramsJson: string) => string;
}
