import { MemoryManager } from './MemoryManager';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  cacheSize: number;
  timestamp: number;
}

export interface PerformanceStats {
  averageRenderTime: number;
  peakMemoryUsage: number;
  currentCacheSize: number;
  totalRenders: number;
  slowRenders: number;
}

export interface GlobalPerformanceContextType {
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getGlobalStats: () => {
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    totalCachesSize: number;
    caches: Record<
      string,
      {
        items: number;
        size: number;
      }
    >;
  };
  optimizeAll: () => void;
}

export const getDetailedStats = (
  componentName: string,
  stats: PerformanceStats,
  metrics: PerformanceMetrics[]
) => {
  return {
    component: componentName,
    stats,
    recentMetrics: metrics.slice(-10),
    memoryStats: MemoryManager.getMemoryStats()
  };
};
