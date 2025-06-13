// Declare Go class from wasm_exec.js
declare class Go {
    importObject: WebAssembly.Imports;
    run(instance: WebAssembly.Instance): Promise<void>;
}

// These functions will be globally available after WASM initialization
declare function renderASCII(input: string, mode: string): string;

let wasmInitialized = false;

export async function initWasm(): Promise<{ renderASCII: typeof renderASCII }> {
    if (wasmInitialized) {
        return { renderASCII };
    }

    const go = new Go();
    try {
        const result = await WebAssembly.instantiateStreaming(fetch("dist/rendertree.wasm"), go.importObject);
        go.run(result.instance);
        wasmInitialized = true;
        return { renderASCII };
    } catch (e) {
        console.error("Error initializing WebAssembly:", e);
        throw e;
    }
}
