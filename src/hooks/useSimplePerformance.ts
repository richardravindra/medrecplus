import { memoryManager, medicalCache } from '../utils/SimpleMemoryManager';
import { log } from '../utils/logger';

// Hook for easy access to simple optimization features
export const useSimplePerformance = () => {
  const getCacheInfo = () => {
    const _stats = memoryManager.getStats();
    const memoryUsage = memoryManager.getMemoryUsage();
    return { _stats, memoryUsage };
  };

  const clearCache = (cacheName?: string) => {
    if (cacheName) {
      memoryManager.clearCache(cacheName);
      log.debug(`Cleared ${cacheName} cache`, undefined, 'SimplePerformance');
    } else {
      memoryManager.clearAll();
      log.debug('Cleared all caches', undefined, 'SimplePerformance');
    }
  };

  const forceCleanup = () => {
    memoryManager.cleanup();
    log.debug('Forced cleanup completed', undefined, 'SimplePerformance');
  };

  return {
    getCacheInfo,
    clearCache,
    forceCleanup,
    medicalCache
  };
};

// Utility functions for performance monitoring
export const performanceUtils = {
  // Format bytes to human readable format
  formatBytes: (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Simple performance check for components
  checkPerformance: (componentName: string) => {
    const start = performance.now();
    return {
      end: () => {
        const end = performance.now();
        const duration = end - start;
        if (duration > 100) {
          // Warn if component takes more than 100ms
          log.warn(
            `Slow component render: ${componentName} took ${duration.toFixed(2)}ms`,
            undefined,
            'Performance'
          );
        }
        return duration;
      }
    };
  }
};
