/**
 * Performance Profiler for Large Dataset Analysis
 *
 * This utility provides comprehensive performance monitoring tools for analyzing
 * frontend performance with large datasets (400K+ records).
 */

export interface PerformanceMetrics {
  searchTime: number;
  renderTime: number;
  memoryUsage: number;
  datasetSize: number;
  filteredResults: number;
  bottleneckType: 'search' | 'render' | 'memory' | 'keys';
}

export interface PerformanceReport {
  timestamp: string;
  operation: string;
  metrics: PerformanceMetrics;
  recommendations: string[];
}

class PerformanceProfiler {
  private static reports: PerformanceReport[] = [];
  private static isProfiling = false;

  // React Profiler integration
  static startProfiling(): void {
    this.isProfiling = true;
  }

  static stopProfiling(): void {
    this.isProfiling = false;
    this.generateReport();
  }

  // Profile a specific operation (like search, render, etc.)
  static profileOperation<T>(
    operationName: string,
    operation: () => T,
    datasetInfo?: { total: number; filtered?: number }
  ): T {
    if (!this.isProfiling) {
      return operation();
    }

    const startTime = performance.now();
    const startMemory = this.getMemoryUsage();

    // Mark performance timeline
    performance.mark(`${operationName}-start`);

    const result = operation();

    const endTime = performance.now();
    const endMemory = this.getMemoryUsage();

    // Mark performance timeline
    performance.mark(`${operationName}-end`);
    performance.measure(operationName, `${operationName}-start`, `${operationName}-end`);

    const metrics: PerformanceMetrics = {
      searchTime: endTime - startTime,
      renderTime: endTime - startTime,
      memoryUsage: endMemory - startMemory,
      datasetSize: datasetInfo?.total || 0,
      filteredResults: datasetInfo?.filtered || 0,
      bottleneckType: this.identifyBottleneck(endTime - startTime, endMemory - startMemory)
    };

    this.addReport(operationName, metrics);

    return result;
  }

  // Analyze React component render performance
  static profileReactRender(
    _componentName: string,
    renderFunction: () => void,
    _propsCount?: number
  ): void {
    if (!this.isProfiling) return;

    performance.now();

    renderFunction();

    performance.now();
  }

  // Memory analysis
  private static getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
      if (!memory) return 0;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Identify performance bottlenecks
  private static identifyBottleneck(
    executionTime: number,
    memoryDelta: number
  ): PerformanceMetrics['bottleneckType'] {
    if (memoryDelta > 50) return 'memory'; // 50MB memory spike
    if (executionTime > 100) return 'search'; // 100ms+ operation
    if (executionTime > 16) return 'render'; // >60fps threshold
    return 'keys';
  }

  // Add performance report
  private static addReport(operation: string, metrics: PerformanceMetrics): void {
    const recommendations = this.generateRecommendations(metrics);

    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      operation,
      metrics,
      recommendations
    };

    this.reports.push(report);
  }

  // Generate optimization recommendations
  private static generateRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.searchTime > 100) {
      recommendations.push('Implement debounced search (300ms delay)');
      recommendations.push('Use Web Workers for search operations');
      recommendations.push('Consider indexing/search optimization');
    }

    if (metrics.memoryUsage > 50) {
      recommendations.push('Implement virtual scrolling (react-window)');
      recommendations.push('Use pagination instead of loading all data');
      recommendations.push('Clear unused data from memory');
    }

    if (metrics.datasetSize > 10000 && metrics.filteredResults === metrics.datasetSize) {
      recommendations.push('Load data on-demand instead of all at once');
      recommendations.push('Implement server-side pagination');
    }

    if (metrics.bottleneckType === 'render') {
      recommendations.push('Use React.memo to prevent unnecessary re-renders');
      recommendations.push('Implement useMemo/useCallback for expensive computations');
      recommendations.push('Consider key prop optimization');
    }

    if (metrics.bottleneckType === 'keys') {
      recommendations.push('Fix duplicate React keys - this causes performance issues');
      recommendations.push('Use unique IDs instead of array indices');
    }

    return recommendations;
  }

  // Generate comprehensive performance report
  static generateReport(): void {
    if (this.reports.length === 0) {
      return;
    }

    // Performance metrics calculated but not currently used in reports
    // Future: Store or return these calculations for actual performance reporting

    // Browser performance analysis
    this.analyzeBrowserPerformance();
  }

  // Analyze browser-specific performance metrics
  private static analyzeBrowserPerformance(): void {
    // Memory analysis available but not currently utilized
    // Future: Implement memory usage tracking and reporting

    // Long tasks
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(() => { /* empty */ }).observe({ entryTypes: ['longtask'] });
      } catch {
        // Long task monitoring not available
      }
    }
  }

  // Get React component key issues
  static analyzeReactKeys(): void {
    // This would need to be integrated with React DevTools
  }

  // Clear all performance reports
  static clearReports(): void {
    this.reports = [];
  }

  // Export reports for analysis
  static exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }
}

// Make available globally for console access
declare global {
  interface Window {
    performanceProfiler: typeof PerformanceProfiler;
    startPerformanceProfiling: () => void;
    stopPerformanceProfiling: () => void;
    profileOperation: <T>(
      name: string,
      fn: () => T,
      datasetInfo?: { total: number; filtered?: number }
    ) => T;
  }
}

if (typeof window !== 'undefined') {
  window.performanceProfiler = PerformanceProfiler;
  window.startPerformanceProfiling = PerformanceProfiler.startProfiling;
  window.stopPerformanceProfiling = PerformanceProfiler.stopProfiling;
  window.profileOperation = PerformanceProfiler.profileOperation;
}

export default PerformanceProfiler;
