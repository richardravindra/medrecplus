import { useState } from 'react';
import { MemoryManager } from '../utils/MemoryManager';

interface PerformanceStats {
  memory: {
    caches: Record<string, { size: number; items: number; lastCleanup: number }>;
    memoryUsage: { used: number; total: number; percentage: number };
    totalCachesSize: number;
  };
  caches: {
    caches: Record<string, { size: number; items: number; lastCleanup: number }>;
    memoryUsage: { used: number; total: number; percentage: number };
    totalCachesSize: number;
  };
  timestamp: number;
}

export const usePerformanceOptimizer = () => {
  const [_stats, setStats] = useState<PerformanceStats | null>(null);

  const getStats = () => {
    const memoryStats = MemoryManager.getMemoryStats();
    const cacheStats = MemoryManager.getMemoryStats();

    const newStats: PerformanceStats = {
      memory: memoryStats,
      caches: cacheStats,
      timestamp: Date.now()
    };

    setStats(newStats);
    return { memory: memoryStats, caches: cacheStats };
  };

  const optimizeNow = () => {
    MemoryManager.optimizeMemory();
    MemoryManager.forceCleanup();
  };

  const clearAllCaches = () => {
    MemoryManager.clearAllCaches();
  };

  return {
    _stats,
    getStats,
    optimizeNow,
    clearAllCaches
  };
};
