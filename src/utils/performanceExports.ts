import { GlobalPerformanceContextType } from './performanceUtils';
import { GlobalPerformanceContext } from './performanceContext';

export const useGlobalPerformance = (): GlobalPerformanceContextType => {
  const context = GlobalPerformanceContext;
  if (!context) {
    throw new Error('useGlobalPerformance must be used within a PerformanceProvider');
  }
  return context as unknown as GlobalPerformanceContextType;
};

export { GlobalPerformanceContext };
