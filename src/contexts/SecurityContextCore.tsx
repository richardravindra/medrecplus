import { createContext } from 'react';

export interface SecurityState {
  isLocked: boolean;
  failedAttempts: number;
  lastActivity: number;
  lockoutTime: number | null;
}

export interface SecurityContextType {
  isLocked: boolean;
  failedAttempts: number;
  lockoutTime: number | null;
  remainingLockoutTime: number;
  lockApp: () => void;
  unlockApp: (password: string) => Promise<boolean>;
  recordActivity: () => void;
  checkInactivity: () => void;
  resetFailedAttempts: () => void;
}

export const SecurityContext = createContext<SecurityContextType | undefined>(undefined);
