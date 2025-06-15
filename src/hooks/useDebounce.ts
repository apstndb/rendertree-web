import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing function calls.
 * Delays execution of a function until after a specified delay has passed 
 * since the last time it was invoked.
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds before executing the callback
 * @returns Object containing:
 *   - debouncedCallback: The debounced version of the callback
 *   - cancel: Function to cancel any pending execution
 *   - flush: Function to immediately execute any pending callback
 */
export function useDebounce<TArgs extends readonly unknown[]>(
  callback: (...args: TArgs) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cancel any pending execution
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Execute pending callback immediately
  const flush = useCallback((...args: TArgs) => {
    cancel();
    callbackRef.current(...args);
  }, [cancel]);

  // Debounced callback function
  const debouncedCallback = useCallback(
    (...args: TArgs) => {
      cancel();
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    },
    [delay, cancel]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    debouncedCallback,
    cancel,
    flush
  };
}