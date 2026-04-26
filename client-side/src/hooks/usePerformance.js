import { useCallback, useEffect, useRef, useState } from 'react';

// Custom hook for optimized re-renders
export const useOptimizedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const timeoutRef = useRef();

  const setOptimizedState = useCallback((newState) => {
    // Debounce rapid state updates
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setState(newState);
    }, 16); // ~60fps
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, setOptimizedState];
};

// Hook for throttled function calls
export const useThrottle = (callback, delay) => {
  const lastCall = useRef(0);
  
  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};

// Hook for debounced function calls
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef();
  
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasIntersected, options]);

  return { ref, isIntersecting, hasIntersected };
};

// Hook for smooth scrolling
export const useSmoothScroll = () => {
  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, []);

  const scrollToElement = useCallback((elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, []);

  const scrollToPosition = useCallback((top) => {
    window.scrollTo({
      top,
      behavior: 'smooth'
    });
  }, []);

  return { scrollToTop, scrollToElement, scrollToPosition };
};

// Hook for managing loading states with minimum duration
export const useLoadingState = (minimumDuration = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef();

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    const elapsed = Date.now() - (startTimeRef.current || 0);
    const remaining = Math.max(0, minimumDuration - elapsed);

    setTimeout(() => {
      setIsLoading(false);
    }, remaining);
  }, [minimumDuration]);

  return { isLoading, startLoading, stopLoading };
};

// Hook for preventing layout shift
export const usePreventLayoutShift = () => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const ref = useRef();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return { ref, dimensions };
};
