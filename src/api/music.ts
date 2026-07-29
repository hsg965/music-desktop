import { ofetch } from "ofetch";
import type {
  Bitrate,
  LyricResult,
  MusicSource,
  PicResult,
  SearchKind,
  Track,
  UrlResult,
} from "../types/music";
import {
  cacheKey,
  cachedRequest,
  getRateLimitStatus,
} from "./rateLimit";

const BASE = "https://music-api.gdstudio.xyz/api.php";

/** 缓存 TTL */
const TTL = {
  search: 10 * 60 * 1000,
  url: 8 * 60 * 1000,
  pic: 30 * 60 * 1000,
  lyric: 30 * 60 * 1000,
};

function isTauri(): boolean {
  return (
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    !!(window as any).__TAURI_INTERNALS__
  );
}

async function rawApiGet<T>(params: Record<string, string | number>): Promise<T> {
  const query: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    query[k] = String(v);
  }

  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<T>("proxy_api", { params: query });
  }

  return ofetch<T>(BASE, {
    query,
    timeout: 20000,
  });
}

async function apiGet<T>(
  params: Record<string, string | number>,
  ttlMs: number,
): Promise<T> {
  const key = cacheKey(
    Object.fromEntries(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ),
  );
  return cachedRequest(key, ttlMs, () => rawApiGet<T>(params));
}

/**
 * 按搜索类别解析 API 的 source 参数
 * 文档：在音乐源后加 `_album`（如 netease_album）获取专辑相关曲目列表
 */
export function resolveSearchSource(
  source: string,
  kind: SearchKind = "song",
): string {
  const base = String(source || "netease").replace(/_album$/i, "");
  if (kind === "album") return `${base}_album`;
  return base;
}

/** 搜索（单曲 / 歌手关键词 / 专辑曲目） */
export async function searchTracks(options: {
  name: string;
  source?: MusicSource | string;
  /** 搜索类别：单曲 | 歌手 | 专辑 */
  kind?: SearchKind;
  count?: number;
  pages?: number;
}): Promise<Track[]> {
  const {
    name,
    source = "netease",
    kind = "song",
    count = 20,
    pages = 1,
  } = options;

  const apiSource = resolveSearchSource(source, kind);
  const data = await apiGet<Track[] | { data?: Track[] } | null>(
    {
      types: "search",
      source: apiSource,
      name,
      count,
      pages,
    },
    TTL.search,
  );

  // 回落展示用的 source（去掉 _album）
  const displaySource = String(source).replace(/_album$/i, "") || "netease";

  if (Array.isArray(data)) return normalizeTracks(data, displaySource, kind);
  if (data && Array.isArray((data as { data?: Track[] }).data)) {
    return normalizeTracks(
      (data as { data: Track[] }).data,
      displaySource,
      kind,
    );
  }
  return [];
}

function normalizeTracks(
  list: Track[],
  fallbackSource: string,
  kind: SearchKind = "song",
): Track[] {
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
    // 保留搜索类别，便于 UI 展示
    searchKind: kind,
  }));
}

/** 获取播放地址 */
export async function fetchPlayUrl(
  id: string | number,
  source: string = "netease",
  br: Bitrate = 320,
): Promise<UrlResult | null> {
  try {
    const data = await apiGet<UrlResult | null>(
      {
        types: "url",
        source: String(source).replace(/_album$/i, ""),
        id: String(id),
        br,
      },
      TTL.url,
    );
    if (data && data.url) return data;
    return null;
  } catch (e) {
    if (e instanceof Error && e.message.includes("过于频繁")) throw e;
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
    const data = await apiGet<PicResult | null>(
      {
        types: "pic",
        source: String(source).replace(/_album$/i, ""),
        id: String(picId),
        size,
      },
      TTL.pic,
    );
    return data?.url || "";
  } catch (e) {
    if (e instanceof Error && e.message.includes("过于频繁")) throw e;
    return "";
  }
}

/** 获取歌词 */
export async function fetchLyric(
  lyricId: string | number,
  source: string = "netease",
): Promise<LyricResult> {
  try {
    const data = await apiGet<LyricResult | null>(
      {
        types: "lyric",
        source: String(source).replace(/_album$/i, ""),
        id: String(lyricId),
      },
      TTL.lyric,
    );
    return {
      lyric: data?.lyric || "",
      tlyric: data?.tlyric || "",
    };
  } catch (e) {
    if (e instanceof Error && e.message.includes("过于频繁")) throw e;
    return { lyric: "", tlyric: "" };
  }
}

export { getRateLimitStatus };

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

export const SEARCH_KINDS: {
  label: string;
  value: SearchKind;
  hint: string;
}[] = [
  { label: "单曲", value: "song", hint: "按歌名搜索曲目" },
  { label: "歌手", value: "artist", hint: "按歌手名搜索其作品" },
  {
    label: "专辑",
    value: "album",
    hint: "专辑模式（source 加 _album，返回专辑相关曲目）",
  },
];

export const BITRATE_OPTIONS: { label: string; value: Bitrate }[] = [
  { label: "128K", value: 128 },
  { label: "192K", value: 192 },
  { label: "320K", value: 320 },
  { label: "无损 16bit", value: 740 },
  { label: "无损 24bit", value: 999 },
];
