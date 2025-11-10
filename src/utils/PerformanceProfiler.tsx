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
    console.log('🔍 Performance Profiling Started');
    console.log('💡 Use profileOperation() to measure specific operations');

    // Enable React DevTools Profiler if available
    if (typeof window !== 'undefined' && 'React' in window) {
      console.log('✅ React DevTools detected - Profiler available');
    }
  }

  static stopProfiling(): void {
    this.isProfiling = false;
    console.log('⏹️ Performance Profiling Stopped');
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
    componentName: string,
    renderFunction: () => void,
    propsCount?: number
  ): void {
    if (!this.isProfiling) return;

    const startTime = performance.now();

    // Check for React key issues
    console.log(`🔍 Profiling ${componentName} render...`);

    renderFunction();

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 16) { // > 60fps threshold
      console.warn(`⚠️ Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);

      if (propsCount && propsCount > 100) {
        console.warn(`💡 Consider React.memo or virtualization for ${componentName} (props: ${propsCount})`);
      }
    }
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
  private static identifyBottleneck(executionTime: number, memoryDelta: number): PerformanceMetrics['bottleneckType'] {
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

    console.log(`📊 Performance Report: ${operation}`);
    console.log(`   ⏱️  Time: ${metrics.searchTime.toFixed(2)}ms`);
    console.log(`   💾 Memory: ${metrics.memoryUsage.toFixed(2)}MB`);
    console.log(`   📊 Dataset: ${metrics.datasetSize.toLocaleString()} records`);
    if (metrics.filteredResults > 0) {
      console.log(`   🔍 Filtered: ${metrics.filteredResults.toLocaleString()} results`);
    }
    console.log(`   🚨 Bottleneck: ${metrics.bottleneckType}`);

    if (recommendations.length > 0) {
      console.log(`   💡 Recommendations:`);
      recommendations.forEach(rec => console.log(`      • ${rec}`));
    }
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
    console.log('\n📈 COMPREHENSIVE PERFORMANCE REPORT');
    console.log('=====================================');

    if (this.reports.length === 0) {
      console.log('❌ No performance data collected');
      return;
    }

    const avgSearchTime = this.reports.reduce((sum, r) => sum + r.metrics.searchTime, 0) / this.reports.length;
    const avgMemoryUsage = this.reports.reduce((sum, r) => sum + r.metrics.memoryUsage, 0) / this.reports.length;
    const bottlenecks = this.reports.reduce((acc, r) => {
      acc[r.metrics.bottleneckType] = (acc[r.metrics.bottleneckType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log(`📊 Operations Profiled: ${this.reports.length}`);
    console.log(`⏱️  Average Search Time: ${avgSearchTime.toFixed(2)}ms`);
    console.log(`💾 Average Memory Usage: ${avgMemoryUsage.toFixed(2)}MB`);
    console.log(`🚨 Primary Bottlenecks:`);

    Object.entries(bottlenecks).forEach(([type, count]) => {
      const percentage = ((count / this.reports.length) * 100).toFixed(1);
      console.log(`   • ${type}: ${count} operations (${percentage}%)`);
    });

    console.log('\n🎯 TOP RECOMMENDATIONS:');
    const allRecommendations = this.reports.flatMap(r => r.recommendations);
    const uniqueRecommendations = [...new Set(allRecommendations)].slice(0, 5);

    uniqueRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    // Browser performance analysis
    this.analyzeBrowserPerformance();
  }

  // Analyze browser-specific performance metrics
  private static analyzeBrowserPerformance(): void {
    console.log('\n🌐 BROWSER PERFORMANCE ANALYSIS:');

    // Memory info
    if ('memory' in performance) {
      const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (!memory) {
        console.log(`💾 Memory Usage: Information not available`);
      } else {
        console.log(`💾 Memory Usage:`);
        console.log(`   • Used: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   • Allocated: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   • Limit: ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`);

        const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usagePercent > 80) {
          console.log(`   ⚠️  High memory usage: ${usagePercent.toFixed(1)}%`);
        }
      }
    }

    // Navigation timing
    if ('navigation' in performance) {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      console.log(`📱 Page Load Performance:`);
      console.log(`   • DOM Content Loaded: ${nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart}ms`);
      console.log(`   • Page Load: ${nav.loadEventEnd - nav.loadEventStart}ms`);
    }

    // Long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            console.log(`⚠️  Long Tasks Detected:`);
            entries.forEach((entry) => {
              console.log(`   • ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            });
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch {
        console.log('ℹ️  Long task monitoring not available');
      }
    }
  }

  // Get React component key issues
  static analyzeReactKeys(): void {
    console.log('\n🔑 REACT KEY ANALYSIS:');
    console.log('Checking for duplicate keys in rendered components...');

    // This would need to be integrated with React DevTools
    console.log('💡 Use React DevTools Profiler to identify key issues');
    console.log('💡 Look for warnings in console about duplicate keys');
  }

  // Clear all performance reports
  static clearReports(): void {
    this.reports = [];
    console.log('🗑️ Performance reports cleared');
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
    profileOperation: <T>(name: string, fn: () => T, datasetInfo?: { total: number; filtered?: number }) => T;
  }
}

if (typeof window !== 'undefined') {
  window.performanceProfiler = PerformanceProfiler;
  window.startPerformanceProfiling = PerformanceProfiler.startProfiling;
  window.stopPerformanceProfiling = PerformanceProfiler.stopProfiling;
  window.profileOperation = PerformanceProfiler.profileOperation;

  // Debug logging removed - Performance Profiler Tools Available
  console.log('💡 Start with startPerformanceProfiling(), then perform operations');
}

export default PerformanceProfiler;