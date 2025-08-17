import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Cache configuration
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false, // For better performance, don't clone objects
  maxKeys: 1000 // Maximum number of keys
});

interface CacheOptions {
  ttl?: number;
  key?: string;
  condition?: (req: Request) => boolean;
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: Request, customKey?: string): string {
  if (customKey) {
    return customKey;
  }

  const { method, path, query, body } = req;
  const keyData = {
    method,
    path,
    query,
    body: method === 'POST' || method === 'PUT' ? body : undefined
  };

  const hash = crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  return `${method}:${path}:${hash}`;
}

/**
 * Cache middleware for API responses
 */
export function cacheMiddleware(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for certain conditions
    if (options.condition && !options.condition(req)) {
      return next();
    }

    // Skip caching for non-GET requests unless explicitly allowed
    if (req.method !== 'GET' && !options.key) {
      return next();
    }

    const cacheKey = generateCacheKey(req, options.key);
    const cachedResponse = cache.get(cacheKey);

    if (cachedResponse) {
      console.log(`📦 Cache hit for key: ${cacheKey}`);
      return res.json({
        ...cachedResponse,
        _cached: true,
        _cacheTime: new Date().toISOString()
      });
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data: any) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const ttl = options.ttl || 300; // 5 minutes default
        cache.set(cacheKey, data, ttl);
        console.log(`💾 Cached response for key: ${cacheKey} (TTL: ${ttl}s)`);
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Cache AI optimization results specifically
 */
export function cacheAIOptimization(ttl: number = 1800) { // 30 minutes default
  return cacheMiddleware({
    ttl,
    key: undefined, // Use auto-generated key
    condition: (req) => {
      // Only cache optimization requests
      return req.path.includes('/optimize') || req.path.includes('/ai-scheduler');
    }
  });
}

/**
 * Cache tournament data
 */
export function cacheTournamentData(ttl: number = 600) { // 10 minutes default
  return cacheMiddleware({
    ttl,
    condition: (req) => {
      // Cache tournament reads but not writes
      return req.method === 'GET' && req.path.includes('/tournaments');
    }
  });
}

/**
 * Cache player data
 */
export function cachePlayerData(ttl: number = 900) { // 15 minutes default
  return cacheMiddleware({
    ttl,
    condition: (req) => {
      // Cache player reads but not writes
      return req.method === 'GET' && req.path.includes('/players');
    }
  });
}

/**
 * Cache schedule data
 */
export function cacheScheduleData(ttl: number = 300) { // 5 minutes default
  return cacheMiddleware({
    ttl,
    condition: (req) => {
      // Cache schedule reads
      return req.method === 'GET' && req.path.includes('/schedule');
    }
  });
}

/**
 * Invalidate cache by pattern
 */
export function invalidateCache(pattern: string): number {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  
  matchingKeys.forEach(key => cache.del(key));
  
  console.log(`🗑️  Invalidated ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
  return matchingKeys.length;
}

/**
 * Invalidate tournament-related cache
 */
export function invalidateTournamentCache(tournamentId: string): void {
  invalidateCache(`tournaments/${tournamentId}`);
  invalidateCache(`ai-scheduler`);
  invalidateCache(`participants`);
  invalidateCache(`matches`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) * 100,
    vsize: stats.vsize,
    ksize: stats.ksize
  };
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.flushAll();
  console.log('🧹 All cache cleared');
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(): Promise<void> {
  console.log('🔥 Warming up cache...');
  
  // This could be expanded to pre-load frequently accessed data
  // For now, just log that warm-up is available
  console.log('🔥 Cache warm-up completed');
}

export default cache;