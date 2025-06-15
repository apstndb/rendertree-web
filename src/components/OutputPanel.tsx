import React, { useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useWasmContext } from '../contexts/WasmContext';
import { useSettingsContext } from '../contexts/SettingsContext';
import { logger } from '../utils/logger';
import { CharacterRuler } from './CharacterRuler';
import { CopyButton } from './CopyButton';
import { useResizeHandler } from '../hooks/useResizeHandler';
import { useScrollTracking } from '../hooks/useScrollTracking';

/**
 * OutputPanel component responsible for displaying rendered query plan results.
 * 
 * Features:
 * - Displays loading states during WASM initialization and rendering
 * - Shows messages when no output is available
 * - Renders ASCII output with character ruler for alignment
 * - Supports resizable container with drag handle
 * - Provides copy-to-clipboard functionality
 * - Tracks horizontal scroll for ruler synchronization
 * 
 * The component has been refactored for better testability by extracting:
 * - CharacterRuler: Handles ruler display and character measurement
 * - CopyButton: Manages clipboard operations with visual feedback
 * - useResizeHandler: Custom hook for container resizing
 * - useScrollTracking: Custom hook for scroll position and ruler width
 */
const OutputPanel: React.FC = () => {
  const { output, message, isRendering } = useAppContext();
  const { isLoading: isWasmLoading } = useWasmContext();
  const { fontSize } = useSettingsContext();
  const isLoading = isWasmLoading || isRendering;

  // References for DOM elements
  const preContainerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);

  // Custom hooks for extracted functionality
  const containerHeight = useResizeHandler(300, preContainerRef);
  const { scrollLeft, rulerWidth } = useScrollTracking(
    preRef,
    codeRef,
    output,
    fontSize,
    "Consolas, 'Courier New', Courier, monospace"
  );

  // Reduced verbose logging - only log significant state changes
  if (isWasmLoading || isRendering) {
    logger.debug('OutputPanel loading state:', { isWasmLoading, isRendering });
  }

  // Log what's being rendered
  useEffect(() => {
    if (isLoading) {
      logger.debug('OutputPanel is showing loading indicator');
    } else if (message && !output) {
      logger.info('OutputPanel is showing message:', message);
    } else if (output) {
      logger.info('OutputPanel is showing output, length:', output.length);
    } else {
      logger.debug('OutputPanel is in an undefined state - no loading, no message, no output');
    }
  }, [isLoading, message, output]);

  return (
    <div className="content-container">
      {isLoading && (
        <div className="loading-indicator" />
      )}

      {message && !output && (
        <div className="placeholder" data-testid="message-placeholder">{message}</div>
      )}

      {output && (
        <div 
          className="pre-container" 
          ref={preContainerRef}
          style={{ height: `${containerHeight}px` }}
          data-testid="output-container"
        >
          <div className="ruler-container">
            <CharacterRuler 
              scrollLeft={scrollLeft} 
              fontSize={fontSize} 
              width={rulerWidth}
              fontFamily="Consolas, 'Courier New', Courier, monospace"
            />
          </div>
          <pre 
            ref={preRef}
            style={{ 
              fontFamily: "monospace",
              whiteSpace: "pre",
              border: "solid",
              padding: "10px",
              marginTop: "0",
              position: "relative",
              overflow: "auto",
              maxWidth: "100%",
              flex: "1 1 auto",
              boxSizing: "border-box",
              margin: "0"
            }}
          >
            <code 
              ref={codeRef}
              style={{ 
                fontFamily: "Consolas, 'Courier New', Courier, monospace",
                fontSize: `${fontSize}px`
              }}
              data-testid="output-code"
            >
              {output}
            </code>
          </pre>

          <CopyButton 
            content={output}
            data-testid="copy-button"
          />

          <div className="resize-handle" title="Drag to resize" />
        </div>
      )}
    </div>
  );
};

export default OutputPanel;