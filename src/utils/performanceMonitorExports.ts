export const DEFAULT_PERFORMANCE_THRESHOLD = 100;

export const createPerformanceConfig = (thresholdMs?: number) => ({
  thresholdMs: thresholdMs || DEFAULT_PERFORMANCE_THRESHOLD,
  enableMemoryTracking: true,
  enableRenderTracking: true,
  enableNetworkTracking: false
});