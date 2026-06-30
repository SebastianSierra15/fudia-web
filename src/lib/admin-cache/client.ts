"use client";

type AdminCacheEntry<T> = {
  data: T;
  updatedAt: number;
};

const cache = new Map<string, AdminCacheEntry<unknown>>();

export function readAdminCache<T>(key: string): AdminCacheEntry<T> | null {
  const entry = cache.get(key) as AdminCacheEntry<T> | undefined;
  return entry ?? null;
}

export function writeAdminCache<T>(key: string, data: T) {
  cache.set(key, {
    data,
    updatedAt: Date.now(),
  });
}

export function isAdminCacheFresh(key: string, staleMs: number) {
  const entry = cache.get(key);
  return Boolean(entry && Date.now() - entry.updatedAt < staleMs);
}

export function invalidateAdminCache(key: string) {
  cache.delete(key);
}
