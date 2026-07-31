/**
 * 接口限流：5 分钟内最多 50 次真实请求
 * 配合缓存与 in-flight 去重，避免浪费配额
 */

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 50;

/** 时间戳队列（成功发出的真实请求） */
const timestamps: number[] = [];

function prune(now = Date.now()) {
  while (timestamps.length && now - timestamps[0] >= WINDOW_MS) {
    timestamps.shift();
  }
}

export function getRateLimitStatus() {
  prune();
  const used = timestamps.length;
  const remaining = Math.max(0, MAX_REQUESTS - used);
  const resetInMs =
    timestamps.length > 0
      ? Math.max(0, WINDOW_MS - (Date.now() - timestamps[0]))
      : 0;
  return { used, remaining, max: MAX_REQUESTS, resetInMs, windowMs: WINDOW_MS };
}

export function canRequestNow(): boolean {
  prune();
  return timestamps.length < MAX_REQUESTS;
}

/** 登记一次真实请求；超限抛错 */
export function acquireRequestSlot(): void {
  prune();
  if (timestamps.length >= MAX_REQUESTS) {
    const status = getRateLimitStatus();
    const sec = Math.ceil(status.resetInMs / 1000);
    throw new Error(
      `接口请求过于频繁（5 分钟内最多 ${MAX_REQUESTS} 次），请约 ${sec} 秒后再试`,
    );
  }
  timestamps.push(Date.now());
}

// ---------- 缓存 ----------

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

/** 带缓存 + 去重 + 限流 的请求封装 */
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
    acquireRequestSlot();
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
