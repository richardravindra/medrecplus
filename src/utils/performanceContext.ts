import { createContext } from 'react';
import { GlobalPerformanceContextType } from './performanceUtils';

export const GlobalPerformanceContext = createContext<GlobalPerformanceContextType | null>(null);
