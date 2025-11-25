import React, { useEffect } from 'react';
import { memoryManager, initializeMedicalCaches } from '../utils/SimpleMemoryManager';
import { log } from '../utils/logger';

interface SimpleOptimizationConfig {
  enableCaching: boolean;
  enableCleanup: boolean;
  cleanupIntervalMs: number;
}

interface SimpleOptimizationStatus {
  cachesConfigured: boolean;
  cleanupActive: boolean;
  totalCacheEntries: number;
  estimatedMemoryUsage: number;
}

export const SimplePerformanceOptimizer: React.FC<{
  config?: Partial<SimpleOptimizationConfig>;
  onOptimizationComplete?: (status: SimpleOptimizationStatus) => void;
  children?: React.ReactNode;
}> = ({ config = {}, onOptimizationComplete, children }) => {
  const finalConfig: SimpleOptimizationConfig = {
    enableCaching: true,
    enableCleanup: true,
    cleanupIntervalMs: 5 * 60 * 1000, // 5 minutes
    ...config
  };

  const initializeCaches = () => {
    if (!finalConfig.enableCaching) {
      log.debug('Caching disabled in configuration', undefined, 'SimplePerformanceOptimizer');
      return false;
    }

    try {
      initializeMedicalCaches();
      log.debug('Essential medical caches configured', undefined, 'SimplePerformanceOptimizer');
      return true;
    } catch (err) {
      log.error('Failed to configure caches', { error: err }, 'SimplePerformanceOptimizer');
      return false;
    }
  };

  const startCleanup = () => {
    if (!finalConfig.enableCleanup) {
      log.debug('Automatic cleanup disabled', undefined, 'SimplePerformanceOptimizer');
      return false;
    }

    try {
      // The SimpleMemoryManager already handles cleanup internally
      log.debug('Cleanup process started', undefined, 'SimplePerformanceOptimizer');
      return true;
    } catch (_error) {
      log.error('Failed to start cleanup', { error: _error }, 'SimplePerformanceOptimizer');
      return false;
    }
  };

  // Unused function kept for potential future use
  // const getOptimizationStatus = (): SimpleOptimizationStatus => {
  //   const _stats = memoryManager.getStats();
  //   const memoryUsage = memoryManager.getMemoryUsage();
  //   const totalEntries = Object.values(stats).reduce((sum, stat) => sum + stat.size, 0);

  //   return {
  //     cachesConfigured: finalConfig.enableCaching,
  //     cleanupActive: finalConfig.enableCleanup,
  //     totalCacheEntries: totalEntries,
  //     estimatedMemoryUsage: memoryUsage.estimatedSizeBytes
  //   };
  // };

  const runOptimization = async () => {
    log.debug(
      'Starting simple performance optimization...',
      undefined,
      'SimplePerformanceOptimizer'
    );

    const results = {
      cachesConfigured: false,
      cleanupActive: false
    };

    try {
      // Step 1: Configure essential caches
      if (initializeCaches()) {
        results.cachesConfigured = true;
      }

      // Step 2: Start cleanup process
      if (startCleanup()) {
        results.cleanupActive = true;
      }

      const finalStatus: SimpleOptimizationStatus = {
        ...results,
        totalCacheEntries: 0,
        estimatedMemoryUsage: 0
      };

      log.debug(
        'Simple performance optimization completed',
        undefined,
        'SimplePerformanceOptimizer'
      );

      if (onOptimizationComplete) {
        onOptimizationComplete(finalStatus);
      }
    } catch (_error) {
      log.error('Simple optimization failed', { error: _error }, 'SimplePerformanceOptimizer');
    }
  };

  // Run optimization on mount
  useEffect(() => {
    runOptimization();

    // Cleanup on unmount
    return () => {
      memoryManager.stopCleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic status logging (in development only)
  useEffect(() => {
    if (import.meta.env.PROD) {
      return; // Don't log in production
    }

    const interval = setInterval(() => {
      const _stats = memoryManager.getStats();
      const memoryUsage = memoryManager.getMemoryUsage();
      log.debug('Cache status', { _stats, memoryUsage }, 'SimplePerformanceOptimizer');
    }, finalConfig.cleanupIntervalMs);

    return () => clearInterval(interval);
  }, [finalConfig.cleanupIntervalMs]);

  // Always render children
  return <>{children}</>;
};

export default SimplePerformanceOptimizer;
