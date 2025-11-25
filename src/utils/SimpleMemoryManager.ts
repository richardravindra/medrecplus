// Simplified memory management for medical records app
// Focuses on essential caching without over-engineering
import { Patient, Appointment, Invoice, Operator, Treatment, CustomExamination } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface SimpleCacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of entries
}

class SimpleMemoryManager {
  private static instance: SimpleMemoryManager;
  private caches = new Map<string, Map<string, CacheEntry<unknown>>>();
  private configs = new Map<string, SimpleCacheConfig>();
  private cleanupInterval: number | null = null;

  private constructor() {
    // Start periodic cleanup
    this.startCleanup();
  }

  static getInstance(): SimpleMemoryManager {
    if (!SimpleMemoryManager.instance) {
      SimpleMemoryManager.instance = new SimpleMemoryManager();
    }
    return SimpleMemoryManager.instance;
  }

  // Configure a cache with essential settings only
  configureCache(name: string, config: SimpleCacheConfig): void {
    this.configs.set(name, config);

    if (!this.caches.has(name)) {
      this.caches.set(name, new Map());
    }
  }

  // Store data in cache
  set<T>(cacheName: string, key: string, data: T): void {
    const cache = this.caches.get(cacheName);
    const config = this.configs.get(cacheName);

    if (!cache || !config) {
      return; // Cache not configured
    }

    // Remove oldest entries if at max size
    if (cache.size >= config.maxSize) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: config.ttl
    });
  }

  // Retrieve data from cache
  get<T>(cacheName: string, key: string): T | null {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return null;
    }

    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Check if key exists and is not expired
  has(cacheName: string, key: string): boolean {
    const entry = this.get(cacheName, key);
    return entry !== null;
  }

  // Remove specific entry
  delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      return false;
    }
    return cache.delete(key);
  }

  // Clear entire cache
  clearCache(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      cache.clear();
    }
  }

  // Clear all caches
  clearAll(): void {
    for (const cache of this.caches.values()) {
      cache.clear();
    }
  }

  // Get cache statistics
  getStats(): { [cacheName: string]: { size: number; maxSize: number } } {
    const stats: { [cacheName: string]: { size: number; maxSize: number } } = {};

    for (const [name, cache] of this.caches.entries()) {
      const config = this.configs.get(name);
      stats[name] = {
        size: cache.size,
        maxSize: config?.maxSize || 0
      };
    }

    return stats;
  }

  // Force cleanup of expired entries
  cleanup(): void {
    const now = Date.now();

    for (const [_cacheName, cache] of this.caches.entries()) {
      for (const [key, entry] of cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          cache.delete(key);
        }
      }
    }
  }

  // Start periodic cleanup
  private startCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Cleanup every 5 minutes
    this.cleanupInterval = window.setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  // Stop cleanup interval
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Get memory usage estimate
  getMemoryUsage(): { totalEntries: number; estimatedSizeBytes: number } {
    let totalEntries = 0;
    let estimatedSize = 0;

    for (const cache of this.caches.values()) {
      totalEntries += cache.size;

      // Rough estimation: each cache entry + key + overhead
      estimatedSize += cache.size * 200; // Estimate 200 bytes per entry
    }

    return {
      totalEntries,
      estimatedSizeBytes: estimatedSize
    };
  }
}

// Export singleton instance
export const memoryManager = SimpleMemoryManager.getInstance();

// Convenience functions for common medical data types
export const medicalCache = {
  // Patient data (changes occasionally)
  setPatient: (id: string, patient: Patient) => memoryManager.set('patients', id, patient),
  getPatient: (id: string) => memoryManager.get('patients', id),
  delete: (cacheName: string, key: string) => memoryManager.delete(cacheName, key),

  // Appointment data (changes more frequently)
  setAppointment: (id: string, appointment: Appointment) =>
    memoryManager.set('appointments', id, appointment),
  getAppointment: (id: string) => memoryManager.get('appointments', id),

  // Invoice data (changes occasionally)
  setInvoice: (id: string, invoice: Invoice) => memoryManager.set('invoices', id, invoice),
  getInvoice: (id: string) => memoryManager.get('invoices', id),

  // Static data (changes rarely)
  setOperators: (operators: Operator[]) => memoryManager.set('static', 'operators', operators),
  getOperators: () => memoryManager.get('static', 'operators'),

  setTreatments: (treatments: Treatment[]) => memoryManager.set('static', 'treatments', treatments),
  getTreatments: () => memoryManager.get('static', 'treatments'),

  setCustomExaminations: (examinations: CustomExamination[]) =>
    memoryManager.set('static', 'customExaminations', examinations),
  getCustomExaminations: () => memoryManager.get('static', 'customExaminations'),
  clearCustomExaminations: () => memoryManager.clearCache('static'),

  // Search results (very temporary)
  setSearchResults: (query: string, results: unknown[]) =>
    memoryManager.set('search', query, results),
  getSearchResults: (query: string) => memoryManager.get('search', query),

  // Cache management
  clearCache: (cacheName: string) => memoryManager.clearCache(cacheName)
};

// Initialize default cache configurations
export const initializeMedicalCaches = (): void => {
  // Patient cache - 15 minutes TTL, max 100 patients
  memoryManager.configureCache('patients', {
    ttl: 15 * 60 * 1000,
    maxSize: 100
  });

  // Appointment cache - 5 minutes TTL, max 200 appointments
  memoryManager.configureCache('appointments', {
    ttl: 5 * 60 * 1000,
    maxSize: 200
  });

  // Invoice cache - 20 minutes TTL, max 150 invoices
  memoryManager.configureCache('invoices', {
    ttl: 20 * 60 * 1000,
    maxSize: 150
  });

  // Static data cache - 1 hour TTL, max 50 items
  memoryManager.configureCache('static', {
    ttl: 60 * 60 * 1000,
    maxSize: 50
  });

  // Search cache - 2 minutes TTL, max 30 searches
  memoryManager.configureCache('search', {
    ttl: 2 * 60 * 1000,
    maxSize: 30
  });
};

export default memoryManager;
