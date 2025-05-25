// Declare Go class from wasm_exec.js
declare class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
}

// Define interfaces for the rendered node structure
export interface RenderedNode {
    Predicates: string[] | null;
    ID: string;
    TreePart: string;
    NodeText: string;
}

// These functions will be globally available after WASM initialization
declare function renderASCII(input: string, mode: string): string;
declare function render(input: string, mode: string): string;

let wasmInitialized = false;

export async function initWasm(): Promise<{ render: typeof render; renderASCII: typeof renderASCII }> {
    if (wasmInitialized) {
        return { render, renderASCII };
    }

    const go = new Go();
    try {
        const result = await WebAssembly.instantiateStreaming(fetch("dist/rendertree.wasm"), go.importObject);
        go.run(result.instance);
        wasmInitialized = true;
        return { render, renderASCII };
    } catch (e) {
        console.error("Error initializing WebAssembly:", e);
        throw e;
    }
}
