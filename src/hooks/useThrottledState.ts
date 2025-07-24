import { useState, useCallback, useRef, useEffect } from 'react';

interface ThrottleOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * A hook that provides a throttled state update function to prevent excessive rerenders
 * 
 * @param initialValue Initial state value
 * @param options Throttle configuration options
 * @returns [state, setState] - Similar to useState but setState is throttled
 */
export function useThrottledState<T>(initialValue: T, options: ThrottleOptions) {
  const [state, setState] = useState<T>(initialValue);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextValue = useRef<T | null>(null);
  const lastUpdated = useRef<number>(0);

  const { delay, leading = true, trailing = true } = options;

  const throttledSetState = useCallback((value: T) => {
    const now = Date.now();
    const timeElapsed = now - lastUpdated.current;
    
    // Store the latest value
    nextValue.current = value;
    
    // If we haven't updated recently and leading is true, update immediately
    if (timeElapsed >= delay && leading) {
      lastUpdated.current = now;
      setState(value);
      nextValue.current = null;
      return;
    }
    
    // Otherwise, set up a timeout for the trailing edge if it's not already set
    if (trailing && !timeout.current) {
      timeout.current = setTimeout(() => {
        if (nextValue.current !== null) {
          lastUpdated.current = Date.now();
          setState(nextValue.current);
          nextValue.current = null;
        }
        timeout.current = null;
      }, Math.max(0, delay - timeElapsed));
    }
  }, [delay, leading, trailing]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  return [state, throttledSetState] as const;
}