import { ofetch } from "ofetch";
import type {
  Bitrate,
  LyricResult,
  MusicSource,
  PicResult,
  Track,
  UrlResult,
} from "../types/music";

const BASE = "https://music-api.gdstudio.xyz/api.php";

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).__TAURI_INTERNALS__
  );
}

async function apiGet<T>(params: Record<string, string | number>): Promise<T> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    query[k] = String(v);
  }

  // 桌面端走 Rust 代理，规避 WebView CORS
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>("proxy_api", { params: query });
  }

  // 浏览器预览回退
  return ofetch<T>(BASE, {
    query,
    timeout: 20000,
  });
}

/** 搜索歌曲 */
export async function searchTracks(options: {
  name: string;
  source?: MusicSource | string;
  count?: number;
  pages?: number;
}): Promise<Track[]> {
  const { name, source = "netease", count = 20, pages = 1 } = options;
  const data = await apiGet<Track[] | { data?: Track[] } | null>({
    types: "search",
    source,
    name,
    count,
    pages,
  });

  if (Array.isArray(data)) return normalizeTracks(data, source);
  if (data && Array.isArray((data as { data?: Track[] }).data)) {
    return normalizeTracks((data as { data: Track[] }).data, source);
  }
  return [];
}

function normalizeTracks(list: Track[], fallbackSource: string): Track[] {
  return list.map((t) => ({
    ...t,
    id: t.id,
    name: t.name ?? "未知曲目",
    artist: Array.isArray(t.artist)
      ? t.artist
      : t.artist
        ? [String(t.artist)]
        : ["未知歌手"],
    album: t.album ?? "",
    pic_id: t.pic_id,
    lyric_id: t.lyric_id ?? t.id,
    source: (t.source || fallbackSource) as MusicSource,
  }));
}

/** 获取播放地址 */
export async function fetchPlayUrl(
  id: string | number,
  source: string = "netease",
  br: Bitrate = 320,
): Promise<UrlResult | null> {
  try {
    const data = await apiGet<UrlResult | null>({
      types: "url",
      source,
      id: String(id),
      br,
    });
    if (data && data.url) return data;
    return null;
  } catch {
    return null;
  }
}

/** 获取封面 */
export async function fetchPicUrl(
  picId: string | number,
  source: string = "netease",
  size: 300 | 500 = 300,
): Promise<string> {
  try {
    const data = await apiGet<PicResult | null>({
      types: "pic",
      source,
      id: String(picId),
      size,
    });
    return data?.url || "";
  } catch {
    return "";
  }
}

/** 获取歌词 */
export async function fetchLyric(
  lyricId: string | number,
  source: string = "netease",
): Promise<LyricResult> {
  try {
    const data = await apiGet<LyricResult | null>({
      types: "lyric",
      source,
      id: String(lyricId),
    });
    return {
      lyric: data?.lyric || "",
      tlyric: data?.tlyric || "",
    };
  } catch {
    return { lyric: "", tlyric: "" };
  }
}

export const MUSIC_SOURCES: { label: string; value: MusicSource }[] = [
  { label: "网易云", value: "netease" },
  { label: "QQ 音乐", value: "tencent" },
  { label: "酷我", value: "kuwo" },
  { label: "Bilibili", value: "bilibili" },
  { label: "Apple Music", value: "apple" },
  { label: "YouTube Music", value: "ytmusic" },
  { label: "Spotify", value: "spotify" },
  { label: "JOOX", value: "joox" },
  { label: "Tidal", value: "tidal" },
  { label: "Qobuz", value: "qobuz" },
];

export const BITRATE_OPTIONS: { label: string; value: Bitrate }[] = [
  { label: "128K", value: 128 },
  { label: "192K", value: 192 },
  { label: "320K", value: 320 },
  { label: "无损 16bit", value: 740 },
  { label: "无损 24bit", value: 999 },
];
