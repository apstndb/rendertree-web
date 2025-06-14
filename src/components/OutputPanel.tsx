import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useWasmContext } from '../contexts/WasmContext';
import { logger } from '../utils/logger';
import { extractErrorInfo } from '../utils/errorHandling';

// Component for the character ruler
const CharacterRuler: React.FC<{ 
  scrollLeft: number; 
  fontSize: number;
  width: number;
}> = ({ scrollLeft, fontSize, width }) => {
  // Generate ruler marks
  const generateRulerMarks = () => {
    const marks = [];
    // For monospace fonts, character width is typically about 60% of the font size
    // This is an approximation and may need adjustment based on the actual font
    const charWidth = fontSize * 0.6; // Approximate width of a character in monospace font
    const numMarks = Math.ceil(width / charWidth) + 50; // Add extra marks for scrolling

    for (let i = 0; i <= numMarks; i += 10) {
      // Add a major mark every 10 characters
      marks.push(
        <div 
          key={`major-${i}`}
          className="ruler-mark major"
          style={{ 
            left: `${i * charWidth}px`,
          }}
        >
          <div className="ruler-mark-label">{i}</div>
        </div>
      );

      // Add minor marks between major marks
      if (i < numMarks) {
        for (let j = 1; j < 10 && i + j <= numMarks; j++) {
          marks.push(
            <div 
              key={`minor-${i+j}`}
              className="ruler-mark minor"
              style={{ 
                left: `${(i + j) * charWidth}px`,
              }}
            />
          );
        }
      }
    }

    return marks;
  };

  return (
    <div 
      className="character-ruler"
      style={{ 
        transform: `translateX(-${scrollLeft}px)`,
        fontSize: `${fontSize * 0.7}px`, // Smaller font for the ruler
        paddingLeft: '10px' // Match the padding of the pre element
      }}
    >
      {generateRulerMarks()}
    </div>
  );
};

const OutputPanel: React.FC = () => {
  const { output, message, fontSize, isRendering } = useAppContext();
  const { isLoading: isWasmLoading } = useWasmContext();
  const isLoading = isWasmLoading || isRendering;

  // Reduced verbose logging - only log significant state changes
  if (isWasmLoading || isRendering) {
    logger.debug('OutputPanel loading state:', { isWasmLoading, isRendering });
  }

  const [containerHeight, setContainerHeight] = useState<number>(300); // Default height
  const [scrollLeft, setScrollLeft] = useState<number>(0); // Track horizontal scroll position
  const [rulerWidth, setRulerWidth] = useState<number>(1000); // Initial width for ruler
  const preContainerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
  const copyTimeoutRef = useRef<number | null>(null);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);

  // Handle scroll tracking for the ruler
  useEffect(() => {

    const handleScroll = () => {
      if (preRef.current) {
        setScrollLeft(preRef.current.scrollLeft);
      }
    };

    // Calculate the width of the content for the ruler
    const calculateRulerWidth = () => {
      if (codeRef.current && output) {
        // Find the longest line in the output
        const lines = output.split('\n');
        const maxLineLength = Math.max(...lines.map(line => line.length));
        logger.debug('Calculating ruler width - maxLineLength:', maxLineLength, 'fontSize:', fontSize);

        // Estimate the width based on the font size and character count
        // Add some extra width for safety
        const estimatedWidth = maxLineLength * fontSize * 0.6 + 100;
        const newWidth = Math.max(1000, estimatedWidth);
        logger.debug('Setting ruler width to:', newWidth);
        setRulerWidth(newWidth);
      }
    };

    // Set up scroll event listener
    const preElement = preRef.current;
    if (preElement) {
      logger.debug('Setting up scroll event listener');
      preElement.addEventListener('scroll', handleScroll);
      calculateRulerWidth();
    }

    return () => {
      if (preElement) {
        logger.debug('Cleaning up scroll event listener');
        preElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [output, fontSize]);

  // Handle resize functionality
  useEffect(() => {

    const handleMouseMove = (e: Event) => {
      if (!resizeStartRef.current) return;

      // Cast the event to MouseEvent
      const mouseEvent = e as globalThis.MouseEvent;

      const newHeight = Math.max(100, resizeStartRef.current.height + mouseEvent.clientY - resizeStartRef.current.y);
      logger.debug('Resizing container to height:', newHeight);
      setContainerHeight(newHeight);
    };

    const handleMouseUp = () => {
      logger.debug('Mouse up event, ending resize operation');
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: Event) => {
      if (!preContainerRef.current) {
        logger.debug('Mouse down on resize handle, but preContainerRef is not available');
        return;
      }

      // Cast the event to MouseEvent
      const mouseEvent = e as globalThis.MouseEvent;

      const startHeight = preContainerRef.current.clientHeight;
      logger.debug('Starting resize operation, current height:', startHeight);

      resizeStartRef.current = {
        y: mouseEvent.clientY,
        height: startHeight
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeHandle = document.querySelector('.resize-handle');
    if (resizeHandle) {
      logger.debug('Adding resize handle event listener');
      resizeHandle.addEventListener('mousedown', handleMouseDown);
    } else {
      logger.debug('Resize handle element not found');
    }

    return () => {
      if (resizeHandle) {
        logger.debug('Cleaning up resize handle event listener');
        resizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Clean up copy timeout on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Copy output to clipboard
  const copyToClipboard = async () => {
    logger.debug('copyToClipboard called');

    if (!output) {
      logger.warn('Copy to clipboard attempted with no output');
      return;
    }

    try {
      logger.debug('Attempting to copy output to clipboard, length:', output.length);
      await navigator.clipboard.writeText(output);

      const copyButton = document.querySelector('.copy-button');
      if (copyButton) {
        logger.debug('Updating copy button UI to show success');
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');

        // Clear any existing timeout
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }

        copyTimeoutRef.current = setTimeout(() => {
          logger.debug('Resetting copy button UI');
          copyButton.textContent = 'Copy';
          copyButton.classList.remove('copied');
          copyTimeoutRef.current = null;
        }, 2000);
      } else {
        logger.warn('Copy button element not found');
      }

      logger.info('Output copied to clipboard successfully');
    } catch (err) {
      const { message } = extractErrorInfo(err);
      logger.error('Failed to copy text to clipboard:', message);
    }
  };

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

          <button 
            className="copy-button"
            onClick={copyToClipboard}
            data-testid="copy-button"
          >
            Copy
          </button>

          <div className="resize-handle" title="Drag to resize" />
        </div>
      )}
    </div>
  );
};

export default OutputPanel;
