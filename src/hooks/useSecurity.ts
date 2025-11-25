import { useContext } from 'react';
import { SecurityContext } from '../contexts/SecurityContextCore';
import type { SecurityContextType } from '../contexts/SecurityContextCore';

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
