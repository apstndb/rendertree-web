import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { logger } from '../utils/logger';
import { extractErrorInfo } from '../utils/errorHandling';

/**
 * Props for error fallback component
 */
interface ErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Function to reset the error boundary */
  resetError: () => void;
  /** Optional title for the error display */
  title?: string | undefined;
  /** Optional description for the error context */
  description?: string | undefined;
}

/**
 * Default error fallback UI component
 * Displays error information and provides retry option
 */
export const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. You can try refreshing the page or click the button below to retry.'
}) => {
  const { message } = extractErrorInfo(error);

  return (
    <div style={{
      padding: '20px',
      margin: '20px',
      border: '1px solid #e74c3c',
      borderRadius: '8px',
      backgroundColor: '#fdf2f2',
      color: '#c53030'
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#c53030' }}>
        {title}
      </h2>
      
      <p style={{ margin: '0 0 16px 0', color: '#2d3748' }}>
        {description}
      </p>
      
      <details style={{ margin: '16px 0' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
          Error Details
        </summary>
        <pre style={{
          margin: '8px 0 0 0',
          padding: '12px',
          backgroundColor: '#fed7d7',
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </pre>
      </details>
      
      <button
        onClick={resetError}
        style={{
          padding: '8px 16px',
          backgroundColor: '#3182ce',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Try Again
      </button>
    </div>
  );
};

/**
 * Props for ErrorBoundary component
 */
interface ErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  /** Optional custom fallback component */
  fallback?: React.ComponentType<ErrorFallbackProps>;
  /** Optional title for error display */
  title?: string;
  /** Optional description for error context */
  description?: string;
  /** Optional callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * State for ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Generic Error Boundary component for catching React component errors
 * Provides fallback UI and error reporting capabilities
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static method to update state when an error occurs
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Called when an error occurs in a child component
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { message } = extractErrorInfo(error);
    
    logger.error('ErrorBoundary caught an error:', {
      message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name
    });

    // Call optional error callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * Reset the error boundary state
   */
  resetError = () => {
    logger.info('ErrorBoundary reset triggered');
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          title={this.props.title}
          description={this.props.description}
        />
      );
    }

    return this.props.children;
  }
}