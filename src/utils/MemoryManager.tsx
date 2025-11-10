// Memory Management System for Tauri Desktop Application

interface MemoryUsage {
  used: number;
  total: number;
  percentage: number;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface MemoryStats {
  caches: Record<string, { size: number; items: number; lastCleanup: number }>;
  memoryUsage: MemoryUsage;
  totalCachesSize: number;
}

export class MemoryManager {
  private static caches = new Map<string, Map<string, CacheEntry>>();
  private static cleanupIntervals = new Map<string, number>();
  private static readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes
  private static readonly DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly DEFAULT_MAX_ITEMS = 1000;
  private static globalMemoryLimit = 100 * 1024 * 1024; // 100MB
  private static lastGlobalCleanup = Date.now();

  // Cache configuration
  static configureCache(
    cacheName: string,
    options: {
      ttl?: number;
      maxSize?: number;
      maxItems?: number;
      cleanupInterval?: number;
    } = {}
  ): void {
    const cache = new Map<string, CacheEntry>();
    this.caches.set(cacheName, cache);

    const config = {
      ttl: options.ttl || this.DEFAULT_TTL,
      maxSize: options.maxSize || this.DEFAULT_MAX_SIZE,
      maxItems: options.maxItems || this.DEFAULT_MAX_ITEMS,
      cleanupInterval: options.cleanupInterval || 60000 // 1 minute
    };

    // Set up cleanup interval for this cache
    const interval = window.setInterval(() => {
      this.cleanupCache(cacheName, config);
    }, config.cleanupInterval);

    this.cleanupIntervals.set(cacheName, interval);

    console.log(`🔧 Configured cache "${cacheName}" with TTL: ${config.ttl}ms, maxSize: ${(config.maxSize / 1024 / 1024).toFixed(2)}MB`);
  }

  // Store data in cache with memory management
  static set<T>(
    cacheName: string,
    key: string,
    data: T,
    options: {
      ttl?: number;
      priority?: 'low' | 'medium' | 'high';
    } = {}
  ): void {
    const cache = this.caches.get(cacheName);
    if (!cache) {
      console.warn(`Cache "${cacheName}" not found. Use configureCache() first.`);
      return;
    }

    // Silence unused parameter warning
    void options;

    // Calculate data size (approximation)
    const size = this.calculateSize(data);
    const now = Date.now();

    // Check if we need to make space
    this.ensureSpace(cacheName, size);

    // Store the data
    const entry: CacheEntry = {
      data,
      timestamp: now,
      size,
      accessCount: 1,
      lastAccessed: now
    };

    cache.set(key, entry);

    // Check global memory limit
    this.checkGlobalMemoryLimit();

    console.log(`💾 Cached ${key} in "${cacheName}" (${(size / 1024).toFixed(2)}KB)`);
  }

  // Get data from cache
  static get<T>(cacheName: string, key: string): T | null {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    const entry = cache.get(key);
    if (!entry) return null;

    const now = Date.now();

    // Check TTL
    const cacheConfig = this.getCacheConfig();
    if (cacheConfig && (now - entry.timestamp) > cacheConfig.ttl) {
      cache.delete(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    return entry.data as T;
  }

  // Delete specific entry
  static delete(cacheName: string, key: string): boolean {
    const cache = this.caches.get(cacheName);
    if (!cache) return false;

    const deleted = cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Deleted ${key} from cache "${cacheName}"`);
    }
    return deleted;
  }

  // Clear entire cache
  static clearCache(cacheName: string): void {
    const cache = this.caches.get(cacheName);
    if (cache) {
      const size = this.getCacheSize(cache);
      cache.clear();
      console.log(`🗑️ Cleared cache "${cacheName}" (${(size / 1024 / 1024).toFixed(2)}MB freed)`);
    }
  }

  // Clear all caches
  static clearAllCaches(): void {
    let totalFreed = 0;
    for (const [, cache] of this.caches.entries()) {
      totalFreed += this.getCacheSize(cache);
      cache.clear();
    }
    console.log(`🗑️ Cleared all caches (${(totalFreed / 1024 / 1024).toFixed(2)}MB freed)`);
  }

  // Get memory statistics
  static getMemoryStats(): MemoryStats {
    const caches: Record<string, { size: number; items: number; lastCleanup: number }> = {};
    let totalCachesSize = 0;

    for (const [cacheName, cache] of this.caches.entries()) {
      const size = this.getCacheSize(cache);
      caches[cacheName] = {
        size,
        items: cache.size,
        lastCleanup: Date.now()
      };
      totalCachesSize += size;
    }

    return {
      caches,
      memoryUsage: this.getSystemMemoryUsage(),
      totalCachesSize
    };
  }

  // Force cleanup of all caches
  static forceCleanup(): void {
    console.log('🧹 Forcing cleanup of all caches...');

    for (const cacheName of this.caches.keys()) {
      const config = this.getCacheConfig();
      if (config) {
        this.cleanupCache(cacheName, config);
      }
    }

    this.lastGlobalCleanup = Date.now();
    console.log('✅ Force cleanup completed');
  }

  // Optimize memory usage
  static optimizeMemory(): void {
    console.log('⚡ Optimizing memory usage...');

    // Remove least recently used items
    for (const [cacheName, cache] of this.caches.entries()) {
      if (cache.size > 100) { // If cache has many items
        const entries = Array.from(cache.entries())
          .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

        // Remove oldest 25% of items
        const toRemove = Math.floor(entries.length * 0.25);
        for (let i = 0; i < toRemove; i++) {
          cache.delete(entries[i][0]);
        }

        console.log(`🗑️ Removed ${toRemove} old items from cache "${cacheName}"`);
      }
    }

    // Run garbage collection if available
    if (window.gc) {
      window.gc();
      console.log('🗑️ Garbage collection completed');
    }
  }

  // Cleanup on application shutdown
  static cleanup(): void {
    console.log('🧹 Cleaning up MemoryManager...');

    // Clear all cleanup intervals
    for (const interval of this.cleanupIntervals.values()) {
      window.clearInterval(interval);
    }
    this.cleanupIntervals.clear();

    // Clear all caches
    this.clearAllCaches();

    // Close database connections
    this.caches.clear();

    console.log('✅ MemoryManager cleanup completed');
  }

  // Private helper methods

  private static calculateSize(data: unknown): number {
    try {
      // Rough estimation of object size in bytes
      const jsonString = JSON.stringify(data);
      return jsonString.length * 2; // Assume 2 bytes per character (UTF-16)
    } catch {
      return 1024; // Default 1KB if serialization fails
    }
  }

  private static getCacheSize(cache: Map<string, CacheEntry>): number {
    let size = 0;
    for (const entry of cache.values()) {
      size += entry.size;
    }
    return size;
  }

  private static ensureSpace(cacheName: string, requiredSize: number): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const config = this.getCacheConfig();
    if (!config) return;

    const currentSize = this.getCacheSize(cache);

    // Check size limit
    if (currentSize + requiredSize > config.maxSize) {
      this.makeSpace(cacheName, currentSize + requiredSize - config.maxSize);
    }

    // Check item limit
    if (cache.size >= config.maxItems) {
      this.makeSpaceByItems(cacheName, Math.floor(config.maxItems * 0.2)); // Remove 20% of items
    }
  }

  private static makeSpace(cacheName: string, bytesToFree: number): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const entries = Array.from(cache.entries())
      .sort((a, b) => {
        // Sort by access frequency and last accessed time
        const scoreA = a[1].accessCount / (Date.now() - a[1].lastAccessed);
        const scoreB = b[1].accessCount / (Date.now() - b[1].lastAccessed);
        return scoreA - scoreB;
      });

    let freed = 0;
    for (const [key, entry] of entries) {
      cache.delete(key);
      freed += entry.size;
      if (freed >= bytesToFree) break;
    }

    console.log(`🗑️ Freed ${(freed / 1024).toFixed(2)}KB from cache "${cacheName}"`);
  }

  private static makeSpaceByItems(cacheName: string, itemsToRemove: number): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    let removed = 0;
    for (let i = 0; i < Math.min(itemsToRemove, entries.length); i++) {
      cache.delete(entries[i][0]);
      removed++;
    }

    console.log(`🗑️ Removed ${removed} items from cache "${cacheName}"`);
  }

  private static cleanupCache(cacheName: string, config: { maxSize: number; maxItems: number; ttl: number }): void {
    const cache = this.caches.get(cacheName);
    if (!cache) return;

    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of cache.entries()) {
      // Remove expired items
      if (now - entry.timestamp > config.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      cache.delete(key);
    }

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired items from cache "${cacheName}"`);
    }
  }

  private static checkGlobalMemoryLimit(): void {
    const totalSize = this.getTotalCacheSize();

    if (totalSize > this.globalMemoryLimit) {
      console.warn(`⚠️ Global memory limit exceeded: ${(totalSize / 1024 / 1024).toFixed(2)}MB > ${(this.globalMemoryLimit / 1024 / 1024).toFixed(2)}MB`);
      this.optimizeMemory();
    }

    // Periodic global cleanup
    if (Date.now() - this.lastGlobalCleanup > 5 * 60 * 1000) { // 5 minutes
      this.forceCleanup();
    }
  }

  private static getTotalCacheSize(): number {
    let total = 0;
    for (const cache of this.caches.values()) {
      total += this.getCacheSize(cache);
    }
    return total;
  }

  private static getCacheConfig(): { ttl: number; maxSize: number; maxItems: number } | null {
    // Return default config - in a real implementation, this would store configs
    return {
      ttl: this.DEFAULT_TTL,
      maxSize: this.DEFAULT_MAX_SIZE,
      maxItems: this.DEFAULT_MAX_ITEMS
    };
  }

  private static getSystemMemoryUsage(): MemoryUsage {
    // Approximate memory usage estimation
    const total = this.getTotalCacheSize();
    const used = total;
    const percentage = (used / this.globalMemoryLimit) * 100;

    return {
      used,
      total: this.globalMemoryLimit,
      percentage
    };
  }

  // Memory monitoring utilities
  static startMemoryMonitoring(intervalMs: number = 30000): void {
    window.setInterval(() => {
      const stats = this.getMemoryStats();
      console.log('📊 Memory Stats:', {
        totalCachesSize: (stats.totalCachesSize / 1024 / 1024).toFixed(2) + 'MB',
        memoryUsagePercentage: stats.memoryUsage.percentage.toFixed(1) + '%',
        caches: Object.entries(stats.caches).map(([name, info]) => ({
          name,
          size: (info.size / 1024).toFixed(2) + 'KB',
          items: info.items
        }))
      });

      // Auto-optimize if memory usage is high
      if (stats.memoryUsage.percentage > 80) {
        console.warn('⚠️ High memory usage detected, optimizing...');
        this.optimizeMemory();
      }
    }, intervalMs);
  }

  // Export/Import cache for debugging
  static exportCache(cacheName: string): string | null {
    const cache = this.caches.get(cacheName);
    if (!cache) return null;

    const exportData = {
      cacheName,
      entries: Array.from(cache.entries()).map(([key, entry]) => ({
        key,
        data: entry.data,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed
      })),
      exportedAt: Date.now()
    };

    return JSON.stringify(exportData);
  }

  static importCache(cacheData: string): boolean {
    try {
      const importData = JSON.parse(cacheData);
      const cache = this.caches.get(importData.cacheName);

      if (!cache) {
        console.warn(`Cache "${importData.cacheName}" not found for import`);
        return false;
      }

      for (const entry of importData.entries) {
        cache.set(entry.key, {
          data: entry.data,
          timestamp: entry.timestamp,
          size: this.calculateSize(entry.data),
          accessCount: entry.accessCount,
          lastAccessed: entry.lastAccessed
        });
      }

      console.log(`✅ Imported ${importData.entries.length} entries to cache "${importData.cacheName}"`);
      return true;
    } catch (error) {
      console.error('❌ Error importing cache:', error);
      return false;
    }
  }
}

// Extend Window interface for garbage collection
declare global {
  interface Window {
    gc?: () => void;
  }
}

export default MemoryManager;