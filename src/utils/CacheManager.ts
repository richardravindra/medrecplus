export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  averageHits: number;
  memoryUsage: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly defaultTTL: number;
  private readonly maxEntries: number;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(defaultTTL: number = 5 * 60 * 1000, maxEntries: number = 1000) {
    this.defaultTTL = defaultTTL;
    this.maxEntries = maxEntries;

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: customTTL || this.defaultTTL,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let deleted = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deleted++;
      }
    }

    return deleted;
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());

    return {
      totalEntries: this.cache.size,
      totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
      averageHits:
        entries.length > 0
          ? entries.reduce((sum, entry) => sum + entry.hits, 0) / entries.length
          : 0,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  private estimateMemoryUsage(): number {
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // String character size
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Estimated overhead
    }
    return size;
  }

  // Advanced caching methods
  getOrSet<T>(key: string, factory: () => T | Promise<T>, customTTL?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    const result = factory();
    if (result instanceof Promise) {
      return result.then(data => {
        this.set(key, data, customTTL);
        return data;
      });
    } else {
      this.set(key, result, customTTL);
      return Promise.resolve(result);
    }
  }

  // Multiple operations
  getMultiple<T>(keys: string[]): Map<string, T | null> {
    const result = new Map<string, T | null>();
    for (const key of keys) {
      result.set(key, this.get<T>(key));
    }
    return result;
  }

  setMultiple<T>(entries: Map<string, T>, customTTL?: number): void {
    for (const [key, data] of entries.entries()) {
      this.set(key, data, customTTL);
    }
  }

  invalidateMultiple(keys: string[]): number {
    let deleted = 0;
    for (const key of keys) {
      if (this.cache.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  // Cache warming and preloading
  async warm<T>(entries: Map<string, () => T | Promise<T>>, customTTL?: number): Promise<void> {
    const promises = Array.from(entries.entries()).map(async ([key, factory]) => {
      try {
        const data = await factory();
        this.set(key, data, customTTL);
      } catch { // Error handled silently
    }
    });

    await Promise.allSettled(promises);
  }

  // Advanced cache strategies
  memoize<T extends (...args: unknown[]) => unknown>(
    fn: T,
    keyGenerator?: (...args: Parameters<T>) => string,
    ttl?: number
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

      return this.getOrSet(key, () => fn(...args), ttl);
    }) as T;
  }

  // Debugging and monitoring
  dump(): Array<{ key: string; entry: CacheEntry<unknown> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      entry: { ...entry }
    }));
  }

  getExpiredEntries(): string[] {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expired.push(key);
      }
    }

    return expired;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

// Singleton cache instances for different purposes
export const defaultCache = new CacheManager();
export const shortTermCache = new CacheManager(30 * 1000, 500); // 30 seconds, 500 entries
export const longTermCache = new CacheManager(30 * 60 * 1000, 200); // 30 minutes, 200 entries

// Cache factory for different use cases
export const createCache = (ttl: number = 5 * 60 * 1000, maxEntries: number = 1000) => {
  return new CacheManager(ttl, maxEntries);
};
