import React, { useState, useEffect, useRef } from 'react';
import { logger } from '../utils/logger';
import { extractErrorInfo } from '../utils/errorHandling';

/**
 * Props for the CopyButton component
 */
interface CopyButtonProps {
  /** Content to copy to clipboard */
  content: string;
  /** Optional className for styling */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * CopyButton component that handles copying content to clipboard
 * with visual feedback for success/error states.
 * 
 * @param props - Component props
 * @returns JSX element representing the copy button
 */
export const CopyButton: React.FC<CopyButtonProps> = ({ 
  content, 
  className = '', 
  'data-testid': testId = 'copy-button'
}) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const copyTimeoutRef = useRef<number | null>(null);

  // Clean up copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Copy content to clipboard
  const copyToClipboard = async () => {
    logger.debug('copyToClipboard called');

    if (!content) {
      logger.warn('Copy to clipboard attempted with no content');
      return;
    }

    try {
      logger.debug('Attempting to copy content to clipboard, length:', content.length);
      await navigator.clipboard.writeText(content);

      logger.debug('Clipboard write completed, updating copy button state to show success');
      
      // Use a small delay to ensure the clipboard operation is fully complete
      // This helps with browser timing differences, especially in test environments
      await new Promise(resolve => setTimeout(resolve, 10));
      
      setCopyStatus('copied');

      // Clear any existing timeout
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }

      copyTimeoutRef.current = window.setTimeout(() => {
        logger.debug('Resetting copy button state');
        setCopyStatus('idle');
        copyTimeoutRef.current = null;
      }, 2000);

      logger.info('Content copied to clipboard successfully');
    } catch (err) {
      const { message } = extractErrorInfo(err);
      logger.error('Failed to copy text to clipboard:', message);
    }
  };

  return (
    <button 
      className={`copy-button ${copyStatus === 'copied' ? 'copied' : ''} ${className}`.trim()}
      onClick={copyToClipboard}
      data-testid={testId}
    >
      {copyStatus === 'copied' ? 'Copied!' : 'Copy'}
    </button>
  );
};