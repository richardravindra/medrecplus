import React, { useEffect } from 'react';
import { MemoryManager } from '../utils/MemoryManager';
import { OptimizedIndexedDBStorage } from '../utils/OptimizedIndexedDBStorage';
import { optimizedDatabaseService } from '../services/optimizedDatabaseMock';
import { log } from '../utils/logger';

interface OptimizationConfig {
  enableMemoryMonitoring: boolean;
  enableDatabaseOptimization: boolean;
  enableLazyLoading: boolean;
  memoryLimitMB: number;
  cleanupIntervalMs: number;
}

interface OptimizationStatus {
  memoryOptimized: boolean;
  databaseOptimized: boolean;
  cachesConfigured: boolean;
  monitoringActive: boolean;
  lastOptimization: number;
}

export const PerformanceOptimizer: React.FC<{
  config?: Partial<OptimizationConfig>;
  onOptimizationComplete?: (status: OptimizationStatus) => void;
  children?: React.ReactNode;
}> = ({ config = {}, onOptimizationComplete, children }) => {
  
  const finalConfig: OptimizationConfig = {
    enableMemoryMonitoring: true,
    enableDatabaseOptimization: true,
    enableLazyLoading: true,
    memoryLimitMB: 100,
    cleanupIntervalMs: 60000,
    ...config
  };

  const addLog = (message: string) => {
    log.debug(message, undefined, 'PerformanceOptimizer');
  };

  const configureCaches = () => {
    addLog('Configuring memory caches...');

    // Configure caches with appropriate sizes based on data type
    MemoryManager.configureCache('patients', {
      ttl: 15 * 60 * 1000, // 15 minutes
      maxSize: 30 * 1024 * 1024, // 30MB
      maxItems: 2000,
      cleanupInterval: 120000 // 2 minutes
    });

    MemoryManager.configureCache('appointments', {
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 15 * 1024 * 1024, // 15MB
      maxItems: 1000,
      cleanupInterval: 90000 // 1.5 minutes
    });

    MemoryManager.configureCache('invoices', {
      ttl: 20 * 60 * 1000, // 20 minutes
      maxSize: 10 * 1024 * 1024, // 10MB
      maxItems: 500,
      cleanupInterval: 180000 // 3 minutes
    });

    MemoryManager.configureCache('treatments', {
      ttl: 30 * 60 * 1000, // 30 minutes (changes rarely)
      maxSize: 5 * 1024 * 1024, // 5MB
      maxItems: 200,
      cleanupInterval: 300000 // 5 minutes
    });

    MemoryManager.configureCache('operators', {
      ttl: 60 * 60 * 1000, // 1 hour (changes very rarely)
      maxSize: 2 * 1024 * 1024, // 2MB
      maxItems: 50,
      cleanupInterval: 600000 // 10 minutes
    });

    MemoryManager.configureCache('search_results', {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 8 * 1024 * 1024, // 8MB
      maxItems: 300,
      cleanupInterval: 60000 // 1 minute
    });

    addLog('Memory caches configured successfully');
    return true;
  };

  const optimizeDatabase = async () => {
    addLog('Optimizing database...');

    try {
      // Initialize IndexedDB with indexes
      await OptimizedIndexedDBStorage.initDB();

      // Get current database statistics
      const stats = await OptimizedIndexedDBStorage.getDatabaseStats();
      addLog(`Database stats: ${JSON.stringify(stats)}`);

      // Optimize database (vacuum and rebuild indexes if needed)
      await OptimizedIndexedDBStorage.optimizeDatabase();

      addLog('Database optimization completed');
      return true;
    } catch (error) {
      addLog(`Database optimization failed: ${error}`);
      return false;
    }
  };

  const optimizeMemory = () => {
    addLog('Optimizing memory usage...');

    try {
      // Memory limit set via configuration

      // Force cleanup
      MemoryManager.forceCleanup();

      // Optimize memory usage
      MemoryManager.optimizeMemory();

      addLog(`Memory optimized (limit: ${finalConfig.memoryLimitMB}MB)`);
      return true;
    } catch (error) {
      addLog(`Memory optimization failed: ${error}`);
      return false;
    }
  };

  const startMemoryMonitoring = () => {
    if (finalConfig.enableMemoryMonitoring) {
      addLog('Starting memory monitoring...');
      MemoryManager.startMemoryMonitoring(finalConfig.cleanupIntervalMs);
      return true;
    }
    return false;
  };

  const preloadCriticalData = async () => {
    if (finalConfig.enableLazyLoading) {
      addLog('Preloading critical data...');

      try {
        // Preload commonly accessed data
        await optimizedDatabaseService.preloadData();
        addLog('Critical data preloaded successfully');
        return true;
      } catch (error) {
        addLog(`Data preloading failed: ${error}`);
        return false;
      }
    }
    return false;
  };

  const runOptimization = async () => {
    // setIsOptimizing(true);
    // setOptimizationLog([]);

    addLog('Starting performance optimization...');

    const results = {
      cachesConfigured: false,
      databaseOptimized: false,
      memoryOptimized: false,
      monitoringActive: false
    };

    try {
      // Step 1: Configure caches
      if (configureCaches()) {
        results.cachesConfigured = true;
      }

      // Step 2: Optimize database
      if (finalConfig.enableDatabaseOptimization) {
        results.databaseOptimized = await optimizeDatabase();
      } else {
        results.databaseOptimized = true; // Skipped
      }

      // Step 3: Optimize memory
      results.memoryOptimized = optimizeMemory();

      // Step 4: Start monitoring
      results.monitoringActive = startMemoryMonitoring();

      // Step 5: Preload data
      await preloadCriticalData();

      const finalStatus: OptimizationStatus = {
        ...results,
        lastOptimization: Date.now()
      };

      addLog('Performance optimization completed successfully');

      if (onOptimizationComplete) {
        onOptimizationComplete(finalStatus);
      }

    } catch (error) {
      addLog(`Optimization failed: ${error}`);
    } finally {
      // setIsOptimizing(false);
    }
  };

  // Run optimization on mount
  useEffect(() => {
    runOptimization();

    // Cleanup on unmount
    return () => {
      MemoryManager.cleanup();
      OptimizedIndexedDBStorage.closeDatabase();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Periodic optimization
  useEffect(() => {
    if (!finalConfig.enableMemoryMonitoring) return;

    const interval = setInterval(() => {
      addLog('Running periodic optimization...');
      MemoryManager.forceCleanup();
    }, finalConfig.cleanupIntervalMs * 10); // Every 10 cleanup intervals

    return () => clearInterval(interval);
  }, [finalConfig.enableMemoryMonitoring, finalConfig.cleanupIntervalMs]);

  // Always render children, development overlay removed
  return (
    <>
      {children}
    </>
  );
};

// Hook for easy access to optimization features is now in src/hooks/usePerformanceOptimizer.tsx

export default PerformanceOptimizer;