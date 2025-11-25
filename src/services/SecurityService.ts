import * as bcrypt from 'bcryptjs';
import { ValidationService } from './ValidationService';

export class SecurityService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  private static readonly AUTO_LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutes

  // Password hashing and verification
  static async hashPassword(password: string): Promise<string> {
    try {
      // Validate password strength first
      const validation = ValidationService.validatePasswordStrength(password);
      if (!validation.isValid) {
        // Preserve the original validation error message for better user feedback
        throw new Error(
          `Password does not meet security requirements: ${validation.errors.join(', ')}`
        );
      }

      return await bcrypt.hash(password, this.SALT_ROUNDS);
    } catch (error) {
      // Re-throw the original error if it's a validation error
      if (
        error instanceof Error &&
        error.message.includes('Password does not meet security requirements')
      ) {
        throw error;
      }
      throw new Error('Failed to secure password');
    }
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }

  // Token generation for sessions and verification
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static generateSessionToken(): string {
    return this.generateSecureToken(64) + '_' + Date.now().toString();
  }

  // Login attempt tracking
  static shouldLockAccount(failedAttempts: number, lastAttemptTime: number): boolean {
    if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      const lockoutEnd = lastAttemptTime + this.LOCKOUT_DURATION;
      return Date.now() < lockoutEnd;
    }
    return false;
  }

  static getRemainingLockoutTime(lastAttemptTime: number): number {
    const lockoutEnd = lastAttemptTime + this.LOCKOUT_DURATION;
    return Math.max(0, lockoutEnd - Date.now());
  }

  // Activity timeout management
  static shouldAutoLock(lastActivity: number): boolean {
    const inactiveTime = Date.now() - lastActivity;
    return inactiveTime >= this.AUTO_LOCK_TIMEOUT;
  }

  // Input security
  static sanitizeAndValidate(data: unknown, schema: 'patient' | 'appointment' | 'operator'): unknown {
    try {
      // First sanitize the input
      const sanitized = ValidationService.sanitizeObject(data);

      // Then validate against schema
      switch (schema) {
        case 'patient':
          return ValidationService.validatePatient(sanitized);
        case 'appointment':
          return ValidationService.validateAppointment(sanitized);
        case 'operator':
          return ValidationService.validateOperator(sanitized);
        default:
          throw new Error('Unknown schema type');
      }
    } catch {
      throw new Error('Invalid input data');
    }
  }

  // Rate limiting helpers
  static createRateLimiter(maxAttempts: number, windowMs: number) {
    const attempts = new Map<string, { count: number; resetTime: number }>();

    return {
      isAllowed: (identifier: string): boolean => {
        const now = Date.now();
        const record = attempts.get(identifier);

        if (!record || now > record.resetTime) {
          attempts.set(identifier, { count: 1, resetTime: now + windowMs });
          return true;
        }

        if (record.count >= maxAttempts) {
          return false;
        }

        record.count++;
        return true;
      },

      getRemainingAttempts: (identifier: string): number => {
        const record = attempts.get(identifier);
        if (!record || Date.now() > record.resetTime) {
          return maxAttempts;
        }
        return Math.max(0, maxAttempts - record.count);
      },

      getResetTime: (identifier: string): number => {
        const record = attempts.get(identifier);
        return record?.resetTime || 0;
      },

      reset: (identifier: string): void => {
        attempts.delete(identifier);
      }
    };
  }

  // Security utilities
  static escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static generateCaptcha(): { text: string; imageData: string } {
    const text = this.generateSecureToken(6).toUpperCase();

    // Generate simple canvas-based captcha
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to get 2D context for captcha generation');
    }

    // Background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, 120, 40);

    // Text
    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText(text, 15, 25);

    // Noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = '#ddd';
      ctx.beginPath();
      ctx.moveTo(Math.random() * 120, Math.random() * 40);
      ctx.lineTo(Math.random() * 120, Math.random() * 40);
      ctx.stroke();
    }

    return {
      text,
      imageData: canvas.toDataURL()
    };
  }

  // Browser fingerprint detection (for additional security)
  static getBrowserFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Browser fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvas.toDataURL()
    ].join('|');

    // Create hash of fingerprint (simplified)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash).toString(16);
  }

  // Password policy configuration
  static getPasswordPolicy() {
    return {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      maxHistory: 5, // Number of previous passwords to remember
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
      commonPasswords: [
        'password',
        '123456',
        '123456789',
        '12345678',
        '12345',
        'qwerty',
        'abc123',
        'password123',
        'admin',
        'letmein'
      ]
    };
  }

  static isCommonPassword(password: string): boolean {
    const policy = this.getPasswordPolicy();
    const lowerPassword = password.toLowerCase();
    return policy.commonPasswords.some(common => lowerPassword.includes(common));
  }

  // Security logging utilities
  static logSecurityEvent(event: string, details: Record<string, unknown> = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      fingerprint: this.getBrowserFingerprint(),
      userAgent: navigator.userAgent
    };


    // In a real application, this would be sent to a security monitoring service
    if (typeof window !== 'undefined' && window.indexedDB) {
      // Store security events in IndexedDB for audit trail
      this.storeSecurityLog(logEntry);
    }
  }

  private static async storeSecurityLog(logEntry: { timestamp: string; event: string; details: Record<string, unknown>; fingerprint: string; userAgent: string }) {
    try {
      const dbName = 'MedRecPlusSecurityLogs';
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('logs')) {
            db.createObjectStore('logs', { keyPath: 'timestamp' });
          }
        };
      });

      const transaction = db.transaction(['logs'], 'readwrite');
      const store = transaction.objectStore('logs');
      await store.add(logEntry);

      // Keep only last 1000 log entries
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        let currentCount = countRequest.result;
        if (currentCount > 1000) {
          // Clean up old entries
          const deleteOld = store.openCursor();
          deleteOld.onsuccess = event => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor && currentCount > 1000) {
              cursor.delete();
              currentCount--;
              cursor.continue();
            }
          };
        }
      };
    } catch { // Error handled silently
    }
  }
}
