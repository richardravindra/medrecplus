import { useState, useRef, useCallback, useEffect } from 'react';
import { MemoryManager } from './MemoryManager';
import { GlobalPerformanceContext } from './performanceContext';

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef<number | null>(null);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    // Configure caches if not already done
    MemoryManager.configureCache('patients', { maxSize: 20 * 1024 * 1024 }); // 20MB
    MemoryManager.configureCache('appointments', { maxSize: 10 * 1024 * 1024 }); // 10MB
    MemoryManager.configureCache('invoices', { maxSize: 10 * 1024 * 1024 }); // 10MB
    MemoryManager.configureCache('treatments', { maxSize: 5 * 1024 * 1024 }); // 5MB

    // Start memory monitoring
    MemoryManager.startMemoryMonitoring(30000); // Every 30 seconds

    monitoringInterval.current = window.setInterval(() => {
      MemoryManager.getMemoryStats();

      // Performance monitoring without console output
    }, 60000); // Every minute
  }, [isMonitoring]);

  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, [isMonitoring]);

  const getGlobalStats = useCallback(() => {
    return MemoryManager.getMemoryStats();
  }, []);

  const optimizeAll = useCallback(() => {
    MemoryManager.optimizeMemory();
    MemoryManager.forceCleanup();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return (
    <GlobalPerformanceContext.Provider
      value={{
        isMonitoring,
        startMonitoring,
        stopMonitoring,
        getGlobalStats,
        optimizeAll
      }}
    >
      {children}
    </GlobalPerformanceContext.Provider>
  );
};
