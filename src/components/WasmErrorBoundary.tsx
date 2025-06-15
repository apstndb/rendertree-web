import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { logger } from '../utils/logger';

/**
 * Props for WASM error fallback component
 */
interface WasmErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Function to reset the error boundary */
  resetError: () => void;
}

/**
 * Specialized error fallback UI for WASM-related errors
 * Provides context-specific error messaging and troubleshooting
 */
export const WasmErrorFallback: React.FC<WasmErrorFallbackProps> = ({
  error,
  resetError
}) => {
  const errorMessage = error.message.toLowerCase();
  
  // Determine error type and provide specific guidance
  const getErrorGuidance = () => {
    if (errorMessage.includes('wasm') || errorMessage.includes('webassembly')) {
      return {
        title: 'WebAssembly Loading Failed',
        description: 'The rendering engine failed to initialize. This could be due to browser compatibility or network issues.',
        suggestions: [
          'Ensure you are using a modern browser that supports WebAssembly',
          'Check your network connection and try refreshing the page',
          'Clear your browser cache and reload',
          'Try using a different browser (Chrome, Firefox, Safari, or Edge)'
        ]
      };
    }
    
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return {
        title: 'Network Error',
        description: 'Failed to download the rendering engine components.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'If using a corporate network, check if WebAssembly files are blocked'
        ]
      };
    }
    
    return {
      title: 'Rendering Engine Error',
      description: 'An unexpected error occurred while initializing the query plan renderer.',
      suggestions: [
        'Try refreshing the page',
        'Check the browser console for more details',
        'Report this issue if it persists'
      ]
    };
  };

  const { title, description, suggestions } = getErrorGuidance();

  return (
    <div style={{
      padding: '24px',
      margin: '20px',
      border: '2px solid #f56565',
      borderRadius: '12px',
      backgroundColor: '#fef5e7',
      maxWidth: '600px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: '#f56565',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          !
        </div>
        <h2 style={{ margin: 0, color: '#c53030', fontSize: '20px' }}>
          {title}
        </h2>
      </div>
      
      <p style={{ margin: '0 0 16px 0', color: '#2d3748', lineHeight: '1.5' }}>
        {description}
      </p>
      
      <div style={{ margin: '16px 0' }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '16px' }}>
          Try these solutions:
        </h3>
        <ul style={{ margin: '0', paddingLeft: '20px', color: '#4a5568' }}>
          {suggestions.map((suggestion, index) => (
            <li key={index} style={{ margin: '4px 0' }}>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
      
      <details style={{ margin: '16px 0', fontSize: '14px' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2d3748' }}>
          Technical Details
        </summary>
        <pre style={{
          margin: '8px 0 0 0',
          padding: '12px',
          backgroundColor: '#fed7d7',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          border: '1px solid #feb2b2'
        }}>
          {error.message}
          {error.stack && `\n\nStack trace:\n${error.stack}`}
        </pre>
      </details>
      
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button
          onClick={resetError}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3182ce',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Try Again
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#38a169',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

/**
 * Props for WasmErrorBoundary component
 */
interface WasmErrorBoundaryProps {
  /** Child components to render */
  children: React.ReactNode;
}

/**
 * Error boundary specifically designed for WASM-related errors
 * Provides specialized error handling and user guidance for WebAssembly issues
 */
export const WasmErrorBoundary: React.FC<WasmErrorBoundaryProps> = ({ children }) => {
  const handleWasmError = (error: Error, errorInfo: React.ErrorInfo) => {
    logger.error('WASM Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
    
    // Additional WASM-specific error reporting could be added here
    // e.g., reporting to analytics, crash reporting service, etc.
  };

  return (
    <ErrorBoundary
      fallback={WasmErrorFallback}
      title="Rendering Engine Error"
      description="The WebAssembly rendering engine encountered an error"
      onError={handleWasmError}
    >
      {children}
    </ErrorBoundary>
  );
};