/**
 * Detection Performance Cache
 * ==========================
 *
 * High-performance caching system for the enhanced model detection.
 * Provides multi-layer caching with TTL, memory optimization,
 * and intelligent cache invalidation strategies.
 */

import { logger } from '../utils/logger.js';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxSize: number;        // Maximum cache size in bytes
  maxEntries: number;     // Maximum number of entries
  defaultTTL: number;      // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  compressionThreshold: number; // Size threshold for compression
}

export class DetectionCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;
  private currentSize = 0;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50 * 1024 * 1024, // 50MB default
      maxEntries: 1000,
      defaultTTL: 300000, // 5 minutes default
      cleanupInterval: 60000, // 1 minute cleanup
      compressionThreshold: 1024, // Compress entries larger than 1KB
      ...config
    };

    this.startCleanupTimer();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.config.defaultTTL;
    const size = this.calculateSize(data);

    // Check if entry is too large for cache
    if (size > this.config.maxSize) {
      logger.warn(`Cache entry too large: ${size} bytes (max: ${this.config.maxSize} bytes)`);
      return;
    }

    // Evict entries if necessary
    while (this.shouldEvict(size)) {
      this.evictLeastRecentlyUsed();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: entryTTL,
      accessCount: 1,
      lastAccessed: now,
      size
    };

    this.cache.set(key, entry);
    this.currentSize += size;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.currentSize -= entry.size;
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? this.stats.hits / total : 0;

    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;

    for (const entry of this.cache.values()) {
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }

    return {
      totalEntries: this.cache.size,
      totalSize: this.currentSize,
      hitCount: this.stats.hits,
      missCount: this.stats.misses,
      hitRate,
      evictions: this.stats.evictions,
      oldestEntry: Date.now() - oldestTimestamp,
      newestEntry: newestTimestamp - Date.now()
    };
  }

  /**
   * Get entries by pattern
   */
  getByPattern(pattern: RegExp): Array<{ key: string; data: T }> {
    const results: Array<{ key: string; data: T }> = [];
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      // Check if entry matches pattern and hasn't expired
      if (pattern.test(key) && (now - entry.timestamp <= entry.ttl)) {
        entry.lastAccessed = now;
        entry.accessCount++;
        results.push({ key, data: entry.data });
      }
    }

    return results;
  }

  /**
   * Update TTL for existing entry
   */
  updateTTL(key: string, newTTL: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    entry.ttl = newTTL;
    entry.lastAccessed = Date.now();
    return true;
  }

  /**
   * Get or create entry (with factory function)
   */
  async getOrCreate(
    key: string,
    factory: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const data = await factory();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Batch set multiple entries
   */
  setBatch(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    for (const { key, data, ttl } of entries) {
      this.set(key, data, ttl);
    }
  }

  /**
   * Batch get multiple entries
   */
  getBatch(keys: string[]): Record<string, T | null> {
    const results: Record<string, T | null> = {};
    for (const key of keys) {
      results[key] = this.get(key);
    }
    return results;
  }

  /**
   * Warm up cache with data
   */
  warmUp(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    logger.info(`Warming up cache with ${entries.length} entries`);
    this.setBatch(entries);
  }

  /**
   * Preload commonly used data
   */
  async preload(preloadFn: () => Promise<Array<{ key: string; data: T; ttl?: number }>>): Promise<void> {
    try {
      const entries = await preloadFn();
      this.warmUp(entries);
      logger.info(`Preloaded ${entries.length} cache entries`);
    } catch (error) {
      logger.error('Failed to preload cache:', error);
    }
  }

  /**
   * Check if entry should be evicted
   */
  private shouldEvict(newEntrySize: number): boolean {
    // Evict if single entry exceeds max size
    if (newEntrySize > this.config.maxSize) {
      return true;
    }

    // Evict if cache is full
    if (this.cache.size >= this.config.maxEntries) {
      return true;
    }

    // Evict if size limit exceeded
    if (this.currentSize + newEntrySize > this.config.maxSize) {
      return true;
    }

    return false;
  }

  /**
   * Evict least recently used entry
   */
  private evictLeastRecentlyUsed(): void {
    let lruKey: string | null = null;
    let lruTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.delete(lruKey);
      this.stats.evictions++;
    }
  }

  /**
   * Evict expired entries
   */
  private evictExpired(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.delete(key);
    }

    return expiredKeys.length;
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: T): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimation (UTF-16)
    } catch (error) {
      return 100; // Default size estimation
    }
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const evicted = this.evictExpired();
    if (evicted > 0) {
      logger.debug(`Cleaned up ${evicted} expired cache entries`);
    }

    // Additional cleanup: remove entries with very low access count
    const lowAccessKeys: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount === 1 && (Date.now() - entry.lastAccessed) > this.config.defaultTTL * 2) {
        lowAccessKeys.push(key);
      }
    }

    for (const key of lowAccessKeys) {
      this.delete(key);
    }

    if (lowAccessKeys.length > 0) {
      logger.debug(`Cleaned up ${lowAccessKeys.length} low-access cache entries`);
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    this.clear();
    logger.info('Detection cache destroyed');
  }
}

/**
 * Specialized cache for model detection results
 */
export class ModelDetectionCache extends DetectionCache<any> {
  constructor() {
    super({
      maxSize: 100 * 1024 * 1024, // 100MB for model detection
      maxEntries: 500,
      defaultTTL: 600000, // 10 minutes default for model detection
      cleanupInterval: 30000, // 30 second cleanup
      compressionThreshold: 2048
    });
  }

  /**
   * Cache model detection result with intelligent key
   */
  cacheDetectionResult(
    configHash: string,
    result: any,
    ttl: number = 600000
  ): void {
    const key = `detection:${configHash}`;
    this.set(key, result, ttl);
  }

  /**
   * Get cached detection result
   */
  getCachedDetection(configHash: string): any | null {
    const key = `detection:${configHash}`;
    return this.get(key);
  }

  /**
   * Cache capability verification result
   */
  cacheCapabilityVerification(
    model: string,
    configHash: string,
    result: any,
    ttl: number = 1800000 // 30 minutes for capabilities
  ): void {
    const key = `capability:${model}:${configHash}`;
    this.set(key, result, ttl);
  }

  /**
   * Get cached capability verification
   */
  getCachedCapabilityVerification(
    model: string,
    configHash: string
  ): any | null {
    const key = `capability:${model}:${configHash}`;
    return this.get(key);
  }

  /**
   * Cache self-correction result
   */
  cacheSelfCorrection(
    originalModel: string,
    context: string,
    result: any,
    ttl: number = 3600000 // 1 hour for corrections
  ): void {
    const key = `correction:${originalModel}:${context}`;
    this.set(key, result, ttl);
  }

  /**
   * Get cached self-correction
   */
  getCachedSelfCorrection(
    originalModel: string,
    context: string
  ): any | null {
    const key = `correction:${originalModel}:${context}`;
    return this.get(key);
  }
}

/**
 * Singleton cache instance
 */
let globalCache: ModelDetectionCache | null = null;

export function getDetectionCache(): ModelDetectionCache {
  if (!globalCache) {
    globalCache = new ModelDetectionCache();
  }
  return globalCache;
}

export function destroyDetectionCache(): void {
  if (globalCache) {
    globalCache.destroy();
    globalCache = null;
  }
}