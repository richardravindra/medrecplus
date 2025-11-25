import React, { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { SecurityContext, SecurityState, SecurityContextType } from './SecurityContextCore';
import { storage } from '../services/UnifiedStorage';
import { SecurityService } from '../services/SecurityService';

const AUTO_LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [securityState, setSecurityState] = useState<SecurityState>({
    isLocked: false,
    failedAttempts: 0,
    lastActivity: Date.now(),
    lockoutTime: null
  });
  const [encryptionEnabled, setEncryptionEnabled] = useState<boolean>(false);

  // Refs for debouncing
  const activityTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const remainingLockoutTime = securityState.lockoutTime
    ? Math.max(0, securityState.lockoutTime - Date.now())
    : 0;

  // Check encryption status on mount and only enable security features if encryption is active
  useEffect(() => {
    const checkEncryptionStatus = async () => {
      try {
        let isEncrypted = false;

        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          // In Tauri app, check backend encryption status
          try {
            isEncrypted = await invoke<boolean>('is_database_encrypted');
          } catch {
            // Backend check failed, assume not encrypted
            isEncrypted = false;
          }
        } else {
          // In web browser, check if encryption is set up in storage
          const encryptionSetup = await storage.getEncryptionSetup();
          const hasPassword = await storage.getPassword();
          isEncrypted = !!(encryptionSetup && hasPassword);
        }

        setEncryptionEnabled(isEncrypted);

        // Only restore lock state if encryption is enabled
        if (isEncrypted) {
          const isLocked = localStorage.getItem('medrec_app_locked') === 'true';
          const lockTime = localStorage.getItem('medrec_lock_time');

          if (isLocked) {
            setSecurityState(prev => ({
              ...prev,
              isLocked: true,
              failedAttempts: 0,
              lockoutTime: null,
              lastActivity: lockTime ? parseInt(lockTime) : Date.now()
            }));
          }
        } else {
          // Clear any existing lock state if encryption is not enabled
          localStorage.removeItem('medrec_app_locked');
          localStorage.removeItem('medrec_lock_time');
          setSecurityState({
            isLocked: false,
            failedAttempts: 0,
            lastActivity: Date.now(),
            lockoutTime: null
          });
        }
      } catch (error) {
        console.error('Failed to check encryption status:', error);
        setEncryptionEnabled(false);
      }
    };

    checkEncryptionStatus();
  }, []);

  const lockApp = useCallback(() => {
    // Only lock if encryption is enabled
    if (!encryptionEnabled) {
      return;
    }

    // Log lock event
    SecurityService.logSecurityEvent('app_locked', {
      timestamp: Date.now(),
      fingerprint: SecurityService.getBrowserFingerprint(),
      reason: 'manual_or_timeout'
    });

    setSecurityState(prev => ({
      ...prev,
      isLocked: true,
      failedAttempts: 0,
      lockoutTime: null
    }));

    // Persist lock state to localStorage
    localStorage.setItem('medrec_app_locked', 'true');
    localStorage.setItem('medrec_lock_time', Date.now().toString());
  }, [encryptionEnabled]);

  const unlockApp = useCallback(
    async (password: string): Promise<boolean> => {
      // Check if currently locked out
      if (securityState.lockoutTime && Date.now() < securityState.lockoutTime) {
        return false;
      }

      try {
        // Log unlock attempt
        SecurityService.logSecurityEvent('unlock_attempt', {
          timestamp: Date.now(),
          fingerprint: SecurityService.getBrowserFingerprint()
        });

        // Check if Tauri API is available
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
          await invoke('unlock_database', { password });
        } else {
          // Running in web browser - validate against stored password for development
          const storedPasswordHash = await storage.getPassword();

          if (!storedPasswordHash) {
            throw new Error('No stored password found');
          }

          // Use secure password verification instead of insecure btoa()
          const isValidPassword = await SecurityService.verifyPassword(
            password,
            storedPasswordHash
          );
          if (!isValidPassword) {
            throw new Error('Invalid password');
          }

          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        }

        // Successful unlock - reset state
        setSecurityState(prev => ({
          ...prev,
          isLocked: false,
          failedAttempts: 0,
          lastActivity: Date.now(),
          lockoutTime: null
        }));

        // Clear persisted lock state from localStorage
        localStorage.removeItem('medrec_app_locked');
        localStorage.removeItem('medrec_lock_time');

        // Log successful unlock
        SecurityService.logSecurityEvent('unlock_success', {
          timestamp: Date.now(),
          fingerprint: SecurityService.getBrowserFingerprint()
        });

        return true;
      } catch (_error) {
        // Log failed unlock attempt
        SecurityService.logSecurityEvent('unlock_failed', {
          timestamp: Date.now(),
          fingerprint: SecurityService.getBrowserFingerprint(),
          error: _error instanceof Error ? _error.message : 'Unknown error'
        });

        // Failed unlock - increment attempts and potentially lockout
        setSecurityState(prev => {
          const newFailedAttempts = prev.failedAttempts + 1;
          const shouldLockout = newFailedAttempts >= MAX_FAILED_ATTEMPTS;

          return {
            ...prev,
            failedAttempts: newFailedAttempts,
            lockoutTime: shouldLockout ? Date.now() + LOCKOUT_DURATION : null
          };
        });

        return false;
      }
    },
    [securityState.lockoutTime]
  );

  const recordActivity = useCallback(() => {
    // Update the ref immediately for accurate timing
    lastActivityRef.current = Date.now();

    // Debounce the state update to reduce re-renders
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }

    activityTimeoutRef.current = setTimeout(() => {
      setSecurityState(prev => ({
        ...prev,
        lastActivity: lastActivityRef.current
      }));
    }, 1000); // Update state once per second maximum
  }, []);

  const checkInactivity = useCallback(() => {
    // Only check inactivity if encryption is enabled
    if (!encryptionEnabled) {
      return;
    }

    // Use the ref for more accurate timing
    const inactiveTime = Date.now() - lastActivityRef.current;
    if (inactiveTime >= AUTO_LOCK_TIMEOUT && !securityState.isLocked) {
      lockApp();
    }
  }, [securityState.isLocked, lockApp, encryptionEnabled]);

  const resetFailedAttempts = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      failedAttempts: 0,
      lockoutTime: null
    }));
  }, []);

  // Check inactivity periodically only if encryption is enabled
  useEffect(() => {
    if (!encryptionEnabled) {
      return;
    }
    const interval = setInterval(checkInactivity, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [checkInactivity, encryptionEnabled]);

  // Handle visibility change (user switching tabs/apps) only if encryption is enabled
  useEffect(() => {
    if (!encryptionEnabled) {
      return;
    }
    const handleVisibilityChange = () => {
      if (document.hidden) {
        checkInactivity();
      } else {
        recordActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkInactivity, recordActivity, encryptionEnabled]);

  // Handle user interaction events only if encryption is enabled
  useEffect(() => {
    if (!encryptionEnabled) {
      return;
    }
    const handleUserActivity = () => {
      recordActivity();
    };

    // Only track keyboard and scroll events to avoid interfering with clicks
    const keyboardEvents = ['keydown'];
    const scrollEvents = ['scroll'];

    keyboardEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    scrollEvents.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      keyboardEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      scrollEvents.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [recordActivity, encryptionEnabled]);

  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
    };
  }, []);

  const value: SecurityContextType = {
    isLocked: securityState.isLocked && encryptionEnabled, // Only show as locked if encryption is enabled
    failedAttempts: securityState.failedAttempts,
    lockoutTime: securityState.lockoutTime,
    remainingLockoutTime,
    lockApp,
    unlockApp,
    recordActivity,
    checkInactivity,
    resetFailedAttempts
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};

// Hook is exported from separate file to comply with react-refresh rules
