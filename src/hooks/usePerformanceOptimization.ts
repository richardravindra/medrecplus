import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

export function useMemoizedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(callback, deps) as T;
}

export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Virtual scrolling hook for large lists
export function useVirtualScrolling<T>(
  items: readonly T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return {
      items: items.slice(startIndex, endIndex),
      startIndex,
      endIndex,
      offsetY: startIndex * itemHeight
    };
  }, [items, scrollTop, itemHeight, containerHeight]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollElementProps = useMemo(
    () => ({
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto'
      }
    }),
    [containerHeight, handleScroll]
  );

  return {
    visibleItems,
    scrollElementProps,
    totalHeight: items.length * itemHeight
  };
}

// Memoized search function
export function useMemoizedSearch<T>(
  items: readonly T[],
  searchFn: (item: T, query: string) => boolean,
  query: string
) {
  return useMemo(() => {
    if (!query.trim()) return items;
    return items.filter(item => searchFn(item, query));
  }, [items, searchFn, query]);
}

// Intersection Observer hook for lazy loading
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, options]);

  return isIntersecting;
}

// Performance monitoring hook
export function usePerformanceMonitor(_name: string) {
  const startTimeRef = useRef<number | undefined>(undefined);

  const start = useCallback(() => {
    startTimeRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
  }, []);

  const end = useCallback(() => {
    if (startTimeRef.current) {
      const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      return endTime - startTimeRef.current;
    }
    return 0;
  }, []);

  return { start, end };
}

// Resize observer hook
export function useResizeObserver<T extends Element>(
  elementRef: React.RefObject<T>,
  callback: (entry: ResizeObserverEntry) => void
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      callback(entry);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, callback]);
}

// Optimized pagination hook
export function usePagination<T>(items: readonly T[], itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasNextPage]);

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setCurrentPage(prev => prev - 1);
    }
  }, [hasPrevPage]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage,
    resetPagination,
    totalItems: items.length,
    itemsPerPage
  };
}
