import React, { Suspense, lazy } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>;
  fallback?: React.ReactNode;
  error?: React.ReactNode;
  props?: Record<string, unknown>;
}

export function LazyComponent({ loader, fallback, error, props = {} }: LazyComponentProps) {
  const LazyComp = lazy(loader);

  const defaultFallback = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography variant='body2' color='text.secondary'>
        Loading component...
      </Typography>
    </Box>
  );

  const defaultError = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 2,
        color: 'error.main'
      }}
    >
      <Typography variant='h6'>Failed to load component</Typography>
      <Typography variant='body2'>Please refresh the page and try again.</Typography>
    </Box>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComp {...props} />
      <Suspense fallback={null}>{error || defaultError}</Suspense>
    </Suspense>
  );
}

// Higher-order component for lazy loading
// eslint-disable-next-line react-refresh/only-export-components
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  const LazyComp = lazy(importFunc);

  return function LazyWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <CircularProgress />}>
        <LazyComp {...props} />
      </Suspense>
    );
  };
}

// Intersection Observer based lazy loader
export function IntersectionLazyLoader({
  children,
  rootMargin = '0px',
  threshold = 0.1,
  fallback = null
}: {
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  fallback?: React.ReactNode;
}) {
  const [isVisible, setIsVisible] = React.useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return (
    <div ref={elementRef}>
      {isVisible ? children : fallback || <div style={{ height: '200px' }} />}
    </div>
  );
}
