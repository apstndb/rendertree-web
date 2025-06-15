import { useEffect, useState } from 'react';
import { logger } from '../utils/logger';
import { measureCharacterWidth } from '../utils/characterMeasurement';

/**
 * Custom hook for tracking scroll position and calculating ruler width
 * based on content and font metrics.
 * 
 * @param preRef - Reference to the scrollable pre element
 * @param codeRef - Reference to the code element containing the content
 * @param output - The text content to analyze for ruler width calculation
 * @param fontSize - Font size for character width measurement
 * @param fontFamily - Font family for character width measurement
 * @returns Object containing scroll position and ruler width
 */
export const useScrollTracking = (
  preRef: React.RefObject<HTMLPreElement>,
  codeRef: React.RefObject<HTMLElement>,
  output: string,
  fontSize: number,
  fontFamily: string = "Consolas, 'Courier New', Courier, monospace"
) => {
  const [scrollLeft, setScrollLeft] = useState<number>(0);
  const [rulerWidth, setRulerWidth] = useState<number>(1000);

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

        // Use actual character width measurement for accuracy
        // Add some extra width for safety
        const actualCharWidth = measureCharacterWidth(fontSize, fontFamily);
        const estimatedWidth = maxLineLength * actualCharWidth + 100;
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
  }, [output, fontSize, fontFamily, preRef, codeRef]);

  return {
    scrollLeft,
    rulerWidth
  };
};