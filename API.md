# API Documentation

This document provides comprehensive API documentation for Rendertree Web's context-based architecture.

## Context APIs

### WasmContext

Manages WebAssembly module initialization and provides access to Go functions.

#### Interface

```typescript
interface WasmContextType {
  isLoading: boolean;
  error: Error | null;
  renderASCII: ((params: string) => string) | null;
}
```

#### Hook: `useWasmContext()`

Returns the WASM context state and functions.

**Returns:**
- `isLoading: boolean` - Whether WASM module is currently loading
- `error: Error | null` - Any error that occurred during WASM initialization
- `renderASCII: function | null` - Go function to render ASCII output from query plan

**Usage:**
```typescript
const { isLoading, error, renderASCII } = useWasmContext();

if (isLoading) {
  // Show loading state
}

if (error) {
  // Handle initialization error
}

if (renderASCII) {
  // Call rendering function
  const result = renderASCII(JSON.stringify(params));
}
```

**Error Conditions:**
- WASM file not found (404)
- Go runtime initialization failure
- Invalid WASM file format

---

### AppContext

Manages core application state including input, output, and rendering logic.

#### Interface

```typescript
interface AppContextType {
  // State
  input: string;
  renderType: string;
  renderMode: string;
  format: string;
  wrapWidth: number;
  output: string;
  message: string;
  isRendering: boolean;
  
  // Setters
  setInput: (input: string) => void;
  setRenderType: (renderType: string) => void;
  setRenderMode: (renderMode: string) => void;
  setFormat: (format: string) => void;
  setWrapWidth: (wrapWidth: number) => void;
  
  // Actions
  handleRender: () => Promise<void>;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loadSampleFile: (filename: string) => Promise<void>;
}
```

#### Hook: `useAppContext()`

Returns the application context state and functions.

**State Properties:**
- `input: string` - Current query plan text
- `renderType: string` - Type of rendering (default: "ascii")
- `renderMode: string` - Rendering mode ("AUTO", "MANUAL", etc.)
- `format: string` - Output format ("CURRENT", "LEGACY", etc.)
- `wrapWidth: number` - Text wrapping width (0 = no wrap)
- `output: string` - Rendered ASCII output
- `message: string` - Status/error message for user
- `isRendering: boolean` - Whether rendering is in progress

**Actions:**
- `handleRender()` - Renders current input using WASM
- `handleFileUpload(event)` - Handles file upload and auto-renders
- `loadSampleFile(filename)` - Loads sample file and shows success message

**Usage:**
```typescript
const { input, setInput, handleRender, isRendering } = useAppContext();

// Set input
setInput("SELECT * FROM users");

// Trigger rendering
await handleRender();

// Check rendering status
if (isRendering) {
  // Show spinner
}
```

**Error Conditions:**
- Empty input when rendering
- WASM not initialized
- Invalid render parameters
- File upload errors

---

### FileContext

Handles file operations including uploads and sample file loading.

#### Interface

```typescript
interface FileContextType {
  handleFileUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (content: string) => void,
    onError: (message: string) => void
  ) => void;
  
  loadSampleFile: (
    filename: string,
    onSuccess: (content: string) => void,
    onError: (message: string) => void,
    onLoading: (message: string) => void
  ) => Promise<void>;
}
```

#### Hook: `useFileContext()`

Returns file operation functions using callback pattern.

**Methods:**

##### `handleFileUpload(event, onSuccess, onError)`
Handles file upload with validation and reading.

**Parameters:**
- `event: React.ChangeEvent<HTMLInputElement>` - File input change event
- `onSuccess: (content: string) => void` - Callback for successful file read
- `onError: (message: string) => void` - Callback for errors

##### `loadSampleFile(filename, onSuccess, onError, onLoading)`
Loads sample file from public directory.

**Parameters:**
- `filename: string` - Path to sample file (e.g., "testdata/sample.yaml")
- `onSuccess: (content: string) => void` - Callback for successful load
- `onError: (message: string) => void` - Callback for errors
- `onLoading: (message: string) => void` - Callback for loading state

**Usage:**
```typescript
const { handleFileUpload, loadSampleFile } = useFileContext();

// File upload
handleFileUpload(
  event,
  (content) => {
    setInput(content);
    console.log('File loaded successfully');
  },
  (error) => {
    setMessage(`Upload error: ${error}`);
  }
);

// Sample file loading
await loadSampleFile(
  'testdata/dca_profile.yaml',
  (content) => setInput(content),
  (error) => setMessage(`Load error: ${error}`),
  (msg) => setMessage(msg)
);
```

**Error Conditions:**
- No file selected
- File read errors
- Network errors for sample files
- Invalid file format

---

### SettingsContext

Manages user preferences with localStorage persistence.

#### Interface

```typescript
interface SettingsContextType {
  fontSize: number;
  setFontSize: (fontSize: number) => void;
}
```

#### Hook: `useSettingsContext()`

Returns user settings state and setters.

**Properties:**
- `fontSize: number` - Current font size in pixels (default: 14)

**Actions:**
- `setFontSize(size)` - Updates font size and persists to localStorage

**Usage:**
```typescript
const { fontSize, setFontSize } = useSettingsContext();

// Get current font size
console.log(`Current size: ${fontSize}px`);

// Update font size
setFontSize(16);
```

**Storage:**
- Automatically persists to `localStorage['rendertree-font-size']`
- Restores setting on page load

---

## WASM Integration

### renderASCII Function

The core Go function exposed through WebAssembly.

#### Signature
```typescript
renderASCII: (params: string) => string
```

#### Parameters
The function expects a JSON string with the following structure:

```typescript
interface RenderParams {
  input: string;    // Query plan text (YAML/JSON)
  mode: string;     // Rendering mode: "AUTO" | "MANUAL" | etc.
  format: string;   // Output format: "CURRENT" | "LEGACY" | etc.
  wrapWidth: number; // Text wrapping width (0 = no wrap)
}
```

#### Usage
```typescript
const params = {
  input: queryPlanText,
  mode: "AUTO",
  format: "CURRENT",
  wrapWidth: 80
};

const result = renderASCII(JSON.stringify(params));
```

#### Error Handling
Throws JavaScript errors for:
- Invalid JSON parameters
- Malformed query plans
- Go runtime errors

---

## Error Handling

### Error Types

#### Context Errors
- **WasmError**: WASM initialization failures
- **RenderError**: Rendering process failures
- **FileError**: File operation failures
- **ValidationError**: Input validation failures

#### Error Propagation
1. Low-level errors (Go, File API) are caught by contexts
2. Contexts expose errors through state or callbacks
3. Components handle errors by updating UI messages
4. Critical errors prevent further operations

### Best Practices

```typescript
// Always check for errors
const { error } = useWasmContext();
if (error) {
  return <ErrorDisplay error={error} />;
}

// Use callback pattern for file operations
fileUpload(event, onSuccess, (error) => {
  setMessage(`Upload failed: ${error}`);
});

// Handle async errors
try {
  await handleRender();
} catch (error) {
  console.error('Render failed:', error);
}
```

---

## State Management Flow

### Data Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   FileContext   │    │   AppContext     │    │  SettingsContext│
│                 │    │                  │    │                 │
│ ┌─────────────┐ │    │ ┌──────────────┐ │    │ ┌─────────────┐ │
│ │handleUpload │ │───▶│ │setInput      │ │    │ │fontSize     │ │
│ │loadSample   │ │    │ │handleRender  │ │    │ │setFontSize  │ │
│ └─────────────┘ │    │ │output        │ │    │ └─────────────┘ │
└─────────────────┘    │ └──────────────┘ │    └─────────────────┘
                       └─────────▲────────┘
                                 │
                       ┌─────────▼────────┐
                       │   WasmContext    │
                       │                  │
                       │ ┌──────────────┐ │
                       │ │renderASCII   │ │
                       │ │isLoading     │ │
                       │ │error         │ │
                       │ └──────────────┘ │
                       └──────────────────┘
```

### Initialization Sequence

1. **WasmContext** loads WebAssembly module
2. **SettingsContext** restores user preferences from localStorage
3. **FileContext** and **AppContext** initialize with default state
4. Components subscribe to context changes
5. User interactions trigger state updates through context methods

---

## Public API Surface

### Stable APIs (v1.0+)
- All context hooks (`useWasmContext`, `useAppContext`, etc.)
- Context provider components
- Core rendering functionality

### Internal APIs
- WASM loading internals
- localStorage implementation details
- Error handling utilities

### Unstable/Experimental
- Render mode options may change
- Output format specifications
- WASM bridge implementation details

---

## Version Compatibility

- **React 18+**: Required for context and hook features
- **TypeScript 5.0+**: Required for strict type checking
- **Modern Browsers**: WebAssembly and ES modules support required

---

## Examples

### Complete Integration Example

```typescript
import React from 'react';
import { useAppContext, useWasmContext, useFileContext } from './contexts';

const QueryPlanRenderer: React.FC = () => {
  const { input, setInput, handleRender, output, isRendering } = useAppContext();
  const { isLoading, error } = useWasmContext();
  const { loadSampleFile } = useFileContext();

  const loadExample = async () => {
    await loadSampleFile(
      'testdata/dca_profile.yaml',
      (content) => {
        setInput(content);
        handleRender();
      },
      (error) => console.error('Load failed:', error),
      (msg) => console.log(msg)
    );
  };

  if (isLoading) return <div>Loading WASM...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={loadExample}>Load Example</button>
      <textarea 
        value={input} 
        onChange={(e) => setInput(e.target.value)} 
      />
      <button onClick={handleRender} disabled={isRendering}>
        {isRendering ? 'Rendering...' : 'Render'}
      </button>
      <pre>{output}</pre>
    </div>
  );
};
```

### Advanced Error Handling

```typescript
const RobustRenderer: React.FC = () => {
  const { handleRender } = useAppContext();
  const [renderError, setRenderError] = useState<string | null>(null);

  const safeRender = async () => {
    try {
      setRenderError(null);
      await handleRender();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setRenderError(`Rendering failed: ${errorMsg}`);
    }
  };

  return (
    <div>
      <button onClick={safeRender}>Safe Render</button>
      {renderError && <div className="error">{renderError}</div>}
    </div>
  );
};
```