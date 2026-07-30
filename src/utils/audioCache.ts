/**
 * 音频本地缓存（安装目录/cache_dir/audio）
 * 仅在 Tauri 环境下生效；浏览器预览时全部跳过。
 */

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).__TAURI_INTERNALS__
  );
}

export function isRemoteMediaUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  const u = url.trim();
  if (/asset\.localhost/i.test(u) || u.startsWith("asset:")) return false;
  return /^(https?:)?\/\//i.test(u);
}

/** 查询本地缓存文件绝对路径（无则 null） */
export async function findCachedAudioPath(
  source: string,
  id: string | number,
  br: number,
): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string | null>("find_cached_audio", {
      source: String(source),
      id: String(id),
      br,
    });
  } catch {
    return null;
  }
}

function normalizeRemoteUrl(url: string): string {
  const u = url.trim();
  if (u.startsWith("//")) return `https:${u}`;
  return u;
}

/** 把远程音频下载到 cache_dir（已存在则直接返回路径） */
export async function cacheRemoteAudio(
  source: string,
  id: string | number,
  br: number,
  url: string,
): Promise<string | null> {
  if (!isTauri()) return null;
  const normalized = normalizeRemoteUrl(url);
  if (!isRemoteMediaUrl(normalized)) {
    console.warn("[audio-cache] skip non-http url:", url);
    return null;
  }
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const path = await invoke<string>("cache_audio_file", {
      source: String(source),
      id: String(id),
      br: Math.round(Number(br)) || 320,
      url: normalized,
    });
    console.info("[audio-cache] ok:", path);
    return path;
  } catch (e) {
    console.warn("[audio-cache] failed:", e);
    return null;
  }
}

/** 将本地路径转为 WebView 可播放的 asset URL */
export async function toPlayableSrc(localPath: string): Promise<string> {
  const { convertFileSrc } = await import("@tauri-apps/api/core");
  return convertFileSrc(localPath);
}

export async function getAudioCacheDir(): Promise<string | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("get_audio_cache_dir");
  } catch {
    return null;
  }
}

export async function getAudioCacheStats(): Promise<{
  path: string;
  fileCount: number;
  totalBytes: number;
} | null> {
  if (!isTauri()) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke("get_audio_cache_stats");
  } catch {
    return null;
  }
}

export async function clearAudioCache(): Promise<number> {
  if (!isTauri()) return 0;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<number>("clear_audio_cache");
  } catch {
    return 0;
  }
}
