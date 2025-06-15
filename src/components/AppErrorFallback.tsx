import React from 'react';

/**
 * Props for main app error fallback component
 */
interface AppErrorFallbackProps {
  /** The error that occurred */
  error: Error;
  /** Function to reset the error boundary */
  resetError: () => void;
}

/**
 * Main application error fallback UI
 * Provides a user-friendly interface when the entire app encounters an error
 */
export const AppErrorFallback: React.FC<AppErrorFallbackProps> = ({
  error,
  resetError
}) => {
  const handleReportIssue = () => {
    const issueBody = encodeURIComponent(`
## Error Report

**Error Message:** ${error.message}

**User Agent:** ${navigator.userAgent}

**Timestamp:** ${new Date().toISOString()}

**Steps to Reproduce:**
1. 
2. 
3. 

**Additional Context:**
Add any additional context about the problem here.

**Stack Trace:**
\`\`\`
${error.stack || 'No stack trace available'}
\`\`\`
    `.trim());

    const issueUrl = `https://github.com/apstndb/rendertree-web/issues/new?title=${encodeURIComponent('Application Error: ' + error.message)}&body=${issueBody}&labels=bug`;
    window.open(issueUrl, '_blank');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f7fafc',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        {/* Error Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#fed7d7',
          color: '#c53030',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          fontSize: '24px',
          fontWeight: 'bold'
        }}>
          ⚠️
        </div>

        <h1 style={{
          margin: '0 0 16px 0',
          color: '#2d3748',
          fontSize: '28px',
          fontWeight: '600'
        }}>
          Oops! Something went wrong
        </h1>

        <p style={{
          margin: '0 0 24px 0',
          color: '#4a5568',
          fontSize: '16px',
          lineHeight: '1.6'
        }}>
          The Rendertree Web application encountered an unexpected error. 
          Don't worry - your data is safe and this is likely a temporary issue.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={resetError}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2c5aa0';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#3182ce';
            }}
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#38a169',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#2f855a';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#38a169';
            }}
          >
            Refresh Page
          </button>

          <button
            onClick={handleReportIssue}
            style={{
              padding: '12px 24px',
              backgroundColor: '#718096',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#4a5568';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#718096';
            }}
          >
            Report Issue
          </button>
        </div>

        {/* Help Text */}
        <div style={{
          backgroundColor: '#edf2f7',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'left'
        }}>
          <h3 style={{
            margin: '0 0 12px 0',
            color: '#2d3748',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            What you can do:
          </h3>
          <ul style={{
            margin: '0',
            paddingLeft: '20px',
            color: '#4a5568',
            fontSize: '14px'
          }}>
            <li style={{ margin: '4px 0' }}>
              <strong>Try Again:</strong> Attempt to recover from the error
            </li>
            <li style={{ margin: '4px 0' }}>
              <strong>Refresh Page:</strong> Reload the application completely
            </li>
            <li style={{ margin: '4px 0' }}>
              <strong>Report Issue:</strong> Help us fix this by reporting the bug
            </li>
            <li style={{ margin: '4px 0' }}>
              <strong>Check Console:</strong> Press F12 and look for more error details
            </li>
          </ul>
        </div>

        {/* Error Details (Collapsible) */}
        <details style={{ 
          marginTop: '24px',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          <summary style={{
            cursor: 'pointer',
            fontWeight: '600',
            color: '#4a5568',
            padding: '8px',
            backgroundColor: '#f7fafc',
            borderRadius: '4px'
          }}>
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
            border: '1px solid #feb2b2',
            color: '#2d3748'
          }}>
            <strong>Error:</strong> {error.message}
            {error.stack && (
              <>
                {'\n\n'}<strong>Stack Trace:</strong>{'\n'}{error.stack}
              </>
            )}
          </pre>
        </details>
      </div>
    </div>
  );
};