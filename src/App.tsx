import React, { Suspense } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { WasmProvider } from './contexts/WasmContext';
import { AppProvider } from './contexts/AppContext';
import { FileProvider } from './contexts/FileContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { useWasmContext } from './contexts/WasmContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WasmErrorBoundary } from './components/WasmErrorBoundary';
import { AppErrorFallback } from './components/AppErrorFallback';

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
    <ErrorBoundary
      fallback={AppErrorFallback}
      title="Application Error"
      description="The Rendertree Web application encountered an unexpected error"
    >
      <WasmErrorBoundary>
        <WasmProvider>
          <ErrorBoundary
            title="Context Error"
            description="An error occurred in the application context"
          >
            <FileProvider>
              <SettingsProvider>
                <AppProvider>
                  <Suspense fallback={<LoadingFallback />}>
                    <AppContent />
                  </Suspense>
                </AppProvider>
              </SettingsProvider>
            </FileProvider>
          </ErrorBoundary>
        </WasmProvider>
      </WasmErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
