import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useWasmContext } from '../contexts/WasmContext';

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
  const [containerHeight, setContainerHeight] = useState<number>(300); // Default height
  const [scrollLeft, setScrollLeft] = useState<number>(0); // Track horizontal scroll position
  const [rulerWidth, setRulerWidth] = useState<number>(1000); // Initial width for ruler
  const preContainerRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const codeRef = useRef<HTMLElement>(null);
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

        // Estimate the width based on the font size and character count
        // Add some extra width for safety
        const estimatedWidth = maxLineLength * fontSize * 0.6 + 100;
        setRulerWidth(Math.max(1000, estimatedWidth));
      }
    };

    // Set up scroll event listener
    const preElement = preRef.current;
    if (preElement) {
      preElement.addEventListener('scroll', handleScroll);
      calculateRulerWidth();
    }

    return () => {
      if (preElement) {
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
      setContainerHeight(newHeight);
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    const handleMouseDown = (e: Event) => {
      if (!preContainerRef.current) return;

      // Cast the event to MouseEvent
      const mouseEvent = e as globalThis.MouseEvent;

      resizeStartRef.current = {
        y: mouseEvent.clientY,
        height: preContainerRef.current.clientHeight
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const resizeHandle = document.querySelector('.resize-handle');
    if (resizeHandle) {
      resizeHandle.addEventListener('mousedown', handleMouseDown);
    }

    return () => {
      if (resizeHandle) {
        resizeHandle.removeEventListener('mousedown', handleMouseDown);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Copy output to clipboard
  const copyToClipboard = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);
      const copyButton = document.querySelector('.copy-button');
      if (copyButton) {
        copyButton.textContent = 'Copied!';
        copyButton.classList.add('copied');

        setTimeout(() => {
          copyButton.textContent = 'Copy';
          copyButton.classList.remove('copied');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy text to clipboard:', err);
    }
  };

  return (
    <div className="content-container">
      {isLoading && (
        <div className="loading-indicator" />
      )}

      {message && !output && (
        <div className="placeholder">{message}</div>
      )}

      {output && (
        <div 
          className="pre-container" 
          ref={preContainerRef}
          style={{ height: `${containerHeight}px` }}
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
            >
              {output}
            </code>
          </pre>

          <button 
            className="copy-button"
            onClick={copyToClipboard}
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
