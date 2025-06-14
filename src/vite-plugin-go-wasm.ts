import type { Plugin } from 'vite';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default function goWasm(): Plugin {
  return {
    name: 'vite-plugin-go-wasm',
    async buildStart() {
      console.log('Building Go WASM...');
      try {
        // Build Go WASM in buildStart to ensure it's available for development
        await execAsync('GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o dist/rendertree.wasm ./');
        console.log('Go WASM built successfully');

        // Copy wasm_exec.js
        const goRoot = (await execAsync('go env GOROOT')).stdout.trim();
        const wasmExecPath = path.join(goRoot, 'lib', 'wasm', 'wasm_exec.js');
        await fs.copyFile(wasmExecPath, 'dist/wasm_exec.js');

        console.log('wasm_exec.js copied');
      } catch (error) {
        console.error('Error in buildStart:', error);
        
        // Provide helpful error information
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          throw new Error('Go WASM build failed: Go compiler not found. Please ensure Go is installed and in PATH.');
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stderr = error instanceof Error && 'stderr' in error ? ` STDERR: ${error.stderr}` : '';
        
        // Throw error to stop the build process completely
        throw new Error(`Go WASM build failed in buildStart: ${errorMessage}${stderr}`);
      }
    },
    async closeBundle() {
      console.log('Building Go WASM...');
      try {
        // Build Go WASM
        await execAsync('GOOS=js GOARCH=wasm go build -ldflags="-s -w" -o dist/rendertree.wasm ./');

        // Copy to assets directory
        await fs.mkdir('dist/assets', { recursive: true });
        await fs.copyFile('dist/rendertree.wasm', 'dist/assets/rendertree.wasm');

        // Copy wasm_exec.js again to ensure it's not deleted
        const goRoot = (await execAsync('go env GOROOT')).stdout.trim();
        const wasmExecPath = path.join(goRoot, 'lib', 'wasm', 'wasm_exec.js');
        await fs.copyFile(wasmExecPath, 'dist/wasm_exec.js');

        console.log('Go WASM build completed and copied to assets directory');
      } catch (error) {
        console.error('Error building Go WASM:', error);
        
        // Provide helpful error information
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
          throw new Error('Go WASM build failed: Go compiler not found. Please ensure Go is installed and in PATH.');
        }
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const stderr = error instanceof Error && 'stderr' in error ? ` STDERR: ${error.stderr}` : '';
        
        // Throw error to stop the build process completely
        throw new Error(`Go WASM build failed in closeBundle: ${errorMessage}${stderr}`);
      }
    }
  };
}
