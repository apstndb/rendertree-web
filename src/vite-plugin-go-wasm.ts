import type { Plugin } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default function goWasm(): Plugin {
  let isBuilding = false; // Prevent duplicate builds
  
  /**
   * Builds Go WASM and sets up necessary files.
   * @param hookName - Name of the hook calling this function (for logging)
   * @param shouldCopyToAssets - Whether to copy WASM to assets directory (for production)
   */
  async function buildGoWasm(hookName: string, shouldCopyToAssets: boolean = false): Promise<void> {
    if (isBuilding) {
      console.log(`${hookName}: Go WASM build already in progress, skipping...`);
      return;
    }
    
    isBuilding = true;
    console.log(`${hookName}: Building Go WASM...`);
    
    try {
      // Build Go WASM
      await execAsync('GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o dist/rendertree.wasm ./');
      console.log(`${hookName}: Go WASM built successfully`);

      // Copy wasm_exec.js
      const goRoot = (await execAsync('go env GOROOT')).stdout.trim();
      const wasmExecPath = path.join(goRoot, 'lib', 'wasm', 'wasm_exec.js');
      await fs.copyFile(wasmExecPath, 'dist/wasm_exec.js');
      console.log(`${hookName}: wasm_exec.js copied`);

      // Copy to assets directory for production builds
      if (shouldCopyToAssets) {
        await fs.mkdir('dist/assets', { recursive: true });
        await fs.copyFile('dist/rendertree.wasm', 'dist/assets/rendertree.wasm');
        console.log(`${hookName}: WASM copied to assets directory`);
      }
    } catch (error) {
      console.error(`Error in ${hookName}:`, error);
      
      // Provide helpful error information
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error('Go WASM build failed: Go compiler not found. Please ensure Go is installed and in PATH.');
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const stderr = error instanceof Error && 'stderr' in error ? ` STDERR: ${error.stderr}` : '';
      
      // Throw error to stop the build process completely
      throw new Error(`Go WASM build failed in ${hookName}: ${errorMessage}${stderr}`);
    } finally {
      isBuilding = false;
    }
  }

  return {
    name: 'vite-plugin-go-wasm',
    async buildStart() {
      // Only build in buildStart for development server
      // Production builds will use closeBundle
      await buildGoWasm('buildStart', false);
    },
    async closeBundle() {
      // Build for production and copy to assets directory
      // The buildStart flag prevents duplicate building during dev server
      await buildGoWasm('closeBundle', true);
    }
  };
}
