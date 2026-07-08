import React, { Suspense } from 'react';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import { AppProvider } from './contexts/AppContext';
import { FileProvider } from './contexts/FileContext';
import { SettingsProvider } from './contexts/SettingsContext';
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
  // WASM initializes lazily on the first render, so the controls are usable
  // immediately -- there is no load-time gate to disable them behind.
  return (
    <div className="app-shell">
      <div className="main-container">
        <InputPanel disabled={false} />
        <OutputPanel />
      </div>
      <footer className="app-footer">
        <a href="https://github.com/apstndb/rendertree-web" target="_blank" rel="noopener noreferrer">
          GitHub Repository
        </a>
      </footer>
    </div>
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
      </WasmErrorBoundary>
    </ErrorBoundary>
  );
}

export default App;
