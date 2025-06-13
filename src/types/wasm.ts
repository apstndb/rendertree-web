export type RenderMode = "AUTO" | "PLAN" | "PROFILE";
export type FormatType = "CURRENT" | "TRADITIONAL" | "COMPACT";
export interface RenderParams { input: string; mode: RenderMode; format: FormatType; wrapWidth: number; }
export interface WasmFunctions { renderASCII: (paramsJson: string) => string; }
