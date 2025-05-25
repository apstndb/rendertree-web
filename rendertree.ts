/**
 * @function renderASCII
 * @global
 * @description Renders the input Spanner execution plan as ASCII art.
 * This function is globally exposed by the 'rendertree.wasm' WebAssembly module
 * and becomes available after WebAssembly.instantiateStreaming and go.run() complete.
 * @param {string} input - The text to be rendered.
 * @param {string} mode - The rendering mode.
 * @returns {string} The ASCII art representation as a string.
 */
declare function renderASCII(input: string, mode: string): string;

/**
 * @function render
 * @global
 * @description Renders the input Spanner execution plan as structured data.
 * This function is globally exposed by the 'rendertree.wasm' WebAssembly module
 * and becomes available after WebAssembly.instantiateStreaming and go.run() complete.
 * @param {string} input - The text to be rendered.
 * @param {string} mode - The rendering mode.
 * @returns {string} The JSON string representation of the rendered plan.
 */
declare function render(input: string, mode: string): string;

// Declare Go class from wasm_exec.js
declare class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
}

// Define interfaces for the rendered node structure
interface RenderedNode {
    Predicates: string[] | null;
    ID: string;
    TreePart: string;
    NodeText: string;
}

const go = new Go();

WebAssembly.instantiateStreaming(fetch("dist/rendertree.wasm"), go.importObject).then((result) => {
    go.run(result.instance);
});
