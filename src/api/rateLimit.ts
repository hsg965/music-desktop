/**
 * 接口请求缓存与 in-flight 去重（已取消客户端频率限制）
 */

interface CacheEntry<T> {
  data: T;
  expireAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function cacheKey(parts: Record<string, string | number>): string {
  return Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k]}`)
    .join("&");
}

export function getCached<T>(key: string): T | undefined {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expireAt) {
    cache.delete(key);
    return undefined;
  }
  return hit.data as T;
}

export function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, { data, expireAt: Date.now() + ttlMs });
}

/** 空结果不进缓存（避免接口偶发空数组被锁 10 分钟） */
function isEmptyCacheValue(data: unknown): boolean {
  if (data == null) return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as { data?: unknown }).data) &&
    ((data as { data: unknown[] }).data?.length ?? 0) === 0
  ) {
    return true;
  }
  return false;
}

/** 带缓存 + 去重 的请求封装 */
export async function cachedRequest<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { bypassCache?: boolean },
): Promise<T> {
  if (!options?.bypassCache) {
    const cached = getCached<T>(key);
    if (cached !== undefined) return cached;
  } else {
    // 强制刷新时清掉旧缓存，避免成功后仍被旧数据覆盖语义混乱
    cache.delete(key);
  }

  // bypass 时也不复用 in-flight 的旧请求结果
  if (!options?.bypassCache) {
    const existing = inflight.get(key);
    if (existing) return existing as Promise<T>;
  }

  const promise = (async () => {
    try {
      const data = await fetcher();
      // 空结果不缓存，方便用户马上重试
      if (!isEmptyCacheValue(data)) {
        setCache(key, data, ttlMs);
      }
      return data;
    } finally {
      inflight.delete(key);
    }
  })();

  if (!options?.bypassCache) {
    inflight.set(key, promise);
  }
  return promise;
}

export function clearApiCache() {
  cache.clear();
}
