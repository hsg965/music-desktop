const KEY = "music-desktop-search-history";
const MAX = 10;

export function loadSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as unknown;
    if (!Array.isArray(list)) return [];
    return list
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim())
      .slice(0, MAX);
  } catch {
    return [];
  }
}

export function saveSearchHistory(list: string[]) {
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}

/** 插入到最前，去重，最多 10 条 */
export function pushSearchHistory(keyword: string, current: string[]): string[] {
  const k = keyword.trim();
  if (!k) return current;
  const next = [k, ...current.filter((x) => x.toLowerCase() !== k.toLowerCase())].slice(
    0,
    MAX,
  );
  saveSearchHistory(next);
  return next;
}

export function removeSearchHistoryItem(keyword: string, current: string[]): string[] {
  const next = current.filter((x) => x !== keyword);
  saveSearchHistory(next);
  return next;
}

export function clearSearchHistory() {
  localStorage.removeItem(KEY);
  return [] as string[];
}
