import { useEffect, useRef, useState, useCallback } from 'react';
import { MemoryManager } from '../utils/MemoryManager';
import { PerformanceMetrics, PerformanceStats, getDetailedStats } from '../utils/performanceUtils';
import { useContext } from 'react';
import { GlobalPerformanceContext } from '../utils/performanceContext';
import { log } from '../utils/logger';

// eslint-disable-next-line react-refresh/only-export-components
export const usePerformanceMonitor = (componentName: string, thresholdMs: number = 100) => {
  const renderStartTime = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [_stats, setStats] = useState<PerformanceStats>({
    averageRenderTime: 0,
    peakMemoryUsage: 0,
    currentCacheSize: 0,
    totalRenders: 0,
    slowRenders: 0
  });
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Track render performance
  const trackRender = useCallback(() => {
    const renderTime = performance.now() - renderStartTime.current;
    const memoryStats = MemoryManager.getMemoryStats();
    const metric: PerformanceMetrics = {
      renderTime,
      memoryUsage: memoryStats.memoryUsage.used,
      cacheSize: memoryStats.totalCachesSize,
      timestamp: Date.now()
    };

    metricsRef.current.push(metric);

    // Keep only last 100 metrics
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }

    // Warn about slow renders
    if (renderTime > thresholdMs) {
      log.slowRender(componentName, renderTime, thresholdMs);
    }

    // Update stats
    const totalRenders = metricsRef.current.length;
    const averageRenderTime =
      metricsRef.current.reduce((sum, m) => sum + m.renderTime, 0) / totalRenders;
    const peakMemoryUsage = Math.max(...metricsRef.current.map(m => m.memoryUsage));
    const currentCacheSize = memoryStats.totalCachesSize;
    const slowRenders = metricsRef.current.filter(m => m.renderTime > thresholdMs).length;

    setStats({
      averageRenderTime,
      peakMemoryUsage,
      currentCacheSize,
      totalRenders,
      slowRenders
    });

    setMetrics([...metricsRef.current]);
  }, [componentName, thresholdMs]);

  // Start render timing
  useEffect(() => {
    renderStartTime.current = performance.now();

    // Track render after component mounts
    const timeout = setTimeout(trackRender, 0);

    return () => clearTimeout(timeout);
  }, [trackRender]);

  // Memory optimization
  const optimizeMemory = useCallback(() => {
    MemoryManager.optimizeMemory();
  }, []);

  const clearCaches = useCallback(() => {
    MemoryManager.clearAllCaches();
  }, []);

  const profile = useCallback(
    (operation: string, fn: () => void | Promise<void>) => {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();

      log.performance(operation, endTime - startTime, componentName);
      return result;
    },
    [componentName]
  );

  const getComponentDetailedStats = useCallback(() => {
    return getDetailedStats(componentName, _stats, metrics);
  }, [componentName, _stats, metrics]);

  return {
    _stats,
    metrics,
    optimizeMemory,
    clearCaches,
    getDetailedStats: getComponentDetailedStats,
    profile
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export const useGlobalPerformance = () => {
  const context = useContext(GlobalPerformanceContext);
  if (!context) {
    throw new Error('useGlobalPerformance must be used within a PerformanceProvider');
  }
  return context;
};

export { PerformanceProvider } from '../utils/performanceHooks';
