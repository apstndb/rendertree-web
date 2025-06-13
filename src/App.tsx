import React, { Suspense } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { WasmProvider } from './contexts/WasmContext';
import { AppProvider } from './contexts/AppContext';
import { useWasmContext } from './contexts/WasmContext';

// Loading component to show while WASM is initializing
const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-indicator" />
    <p>Loading rendering engine... Please wait.</p>
  </div>
);

// Main content component that uses the contexts
const AppContent: React.FC = () => {
  // Get WASM loading state from context
  const { isLoading } = useWasmContext();

  return (
    <>
      <div className="main-container">
        <InputPanel disabled={isLoading} />
        <OutputPanel />
      </div>
      <footer className="app-footer">
        <a href="https://github.com/apstndb/rendertree-web" target="_blank" rel="noopener noreferrer">
          GitHub Repository
        </a>
      </footer>
    </>
  );
};

function App() {
  return (
    <WasmProvider>
      <AppProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AppContent />
        </Suspense>
      </AppProvider>
    </WasmProvider>
  );
}

export default App;
