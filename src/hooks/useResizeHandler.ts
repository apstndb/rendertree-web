import { useEffect, useRef, useState } from 'react';
import { logger } from '../utils/logger';

/**
 * Custom hook for handling container resize functionality.
 * Manages mouse events for resizing a container element via a resize handle.
 * 
 * @param initialHeight - Initial height of the container in pixels
 * @param containerRef - Reference to the container element to resize
 * @returns Container height state
 */
export const useResizeHandler = (
  initialHeight: number = 300,
  containerRef: React.RefObject<HTMLElement>
) => {
  const [containerHeight, setContainerHeight] = useState<number>(initialHeight);
  const resizeStartRef = useRef<{ y: number; height: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: Event) => {
      if (!resizeStartRef.current) return;

      const mouseEvent = e as globalThis.MouseEvent;
      const newHeight = Math.max(
        100, 
        resizeStartRef.current.height + mouseEvent.clientY - resizeStartRef.current.y
      );
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
      if (!containerRef.current) {
        logger.debug('Mouse down on resize handle, but container element is not available');
        return;
      }

      const mouseEvent = e as globalThis.MouseEvent;
      const startHeight = containerRef.current.clientHeight;
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
  }, [containerRef]);

  return containerHeight;
};