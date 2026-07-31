import { ofetch } from "ofetch";
import type {
  Bitrate,
  ChartInfo,
  LyricResult,
  MusicSource,
  PicResult,
  PlaylistDetail,
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
  /** 热榜每日更新，缓存 30 分钟 */
  playlist: 30 * 60 * 1000,
};

/** 网易云官方热榜 */
export const CHART_LIST: ChartInfo[] = [
  { id: "19723756", name: "飙升榜" },
  { id: "3779629", name: "新歌榜" },
  { id: "3778678", name: "热歌榜" },
  { id: "71384707", name: "古典榜" },
  { id: "1978921795", name: "电音榜" },
  { id: "71385702", name: "ACG榜" },
  { id: "2809513713", name: "欧美热歌榜" },
  { id: "5059644681", name: "日语榜" },
  { id: "745956260", name: "韩语榜" },
];

/** CRC32（大写 8 位 hex），用于 playlist 接口 s 参数 */
function crc32Hex(input: string): string {
  let c = 0xffffffff;
  for (let i = 0; i < input.length; i++) {
    c ^= input.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return ((c ^ 0xffffffff) >>> 0)
    .toString(16)
    .toUpperCase()
    .padStart(8, "0");
}

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

/** 规范化音源参数（去掉历史 _album 后缀） */
export function resolveSearchSource(source: string): string {
  return String(source || "netease").replace(/_album$/i, "");
}

/** 搜索曲目 */
export async function searchTracks(options: {
  name: string;
  source?: MusicSource | string;
  count?: number;
  pages?: number;
}): Promise<Track[]> {
  const {
    name,
    source = "netease",
    count = 20,
    pages = 1,
  } = options;

  const apiSource = resolveSearchSource(source);
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

  if (Array.isArray(data)) return normalizeTracks(data, apiSource);
  if (data && Array.isArray((data as { data?: Track[] }).data)) {
    return normalizeTracks((data as { data: Track[] }).data, apiSource);
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

/** 网易云原始曲目结构（playlist 接口） */
interface NeteaseRawTrack {
  id: string | number;
  name?: string;
  ar?: { id?: number; name?: string }[];
  artists?: { id?: number; name?: string }[] | string[];
  al?: {
    id?: number;
    name?: string;
    picUrl?: string;
    pic_str?: string;
    pic?: number | string;
  };
  album?: { name?: string; picUrl?: string; pic_str?: string; pic?: number | string };
}

interface PlaylistApiResponse {
  code?: number;
  playlist?: {
    id?: string | number;
    name?: string;
    description?: string | null;
    coverImgUrl?: string;
    trackCount?: number;
    playCount?: number;
    updateTime?: number;
    tracks?: NeteaseRawTrack[] | null;
  } | null;
}

function normalizeHttps(url: string): string {
  if (!url) return "";
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return `https://${url.slice(7)}`;
  return url;
}

function mapNeteaseTrack(raw: NeteaseRawTrack): Track {
  const artists = raw.ar ?? raw.artists ?? [];
  const artistNames = artists
    .map((a) => (typeof a === "string" ? a : a?.name || ""))
    .filter(Boolean);
  const album = raw.al ?? raw.album;
  const picId =
    album?.pic_str ?? album?.pic ?? "";
  const picUrl = normalizeHttps(album?.picUrl || "");

  return {
    id: raw.id,
    name: raw.name ?? "未知曲目",
    artist: artistNames.length ? artistNames : ["未知歌手"],
    album: album?.name ?? "",
    pic_id: picId,
    lyric_id: raw.id,
    source: "netease",
    picUrl: picUrl || undefined,
  };
}

/** 获取歌单 / 热榜详情 */
export async function fetchPlaylist(id: string | number): Promise<PlaylistDetail> {
  const idStr = String(id);
  const data = await apiGet<PlaylistApiResponse | null>(
    {
      types: "playlist",
      id: idStr,
      s: crc32Hex(idStr),
    },
    TTL.playlist,
  );

  const pl = data?.playlist;
  if (!pl || (data?.code != null && data.code !== 200)) {
    throw new Error("获取热榜失败");
  }

  const tracks = Array.isArray(pl.tracks)
    ? pl.tracks.map(mapNeteaseTrack)
    : [];

  return {
    id: pl.id ?? idStr,
    name: pl.name ?? "热榜",
    description: pl.description || "",
    coverImgUrl: normalizeHttps(pl.coverImgUrl || ""),
    trackCount: pl.trackCount ?? tracks.length,
    playCount: pl.playCount ?? 0,
    updateTime: pl.updateTime ?? 0,
    tracks,
  };
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

export const BITRATE_OPTIONS: { label: string; value: Bitrate }[] = [
  { label: "128K", value: 128 },
  { label: "192K", value: 192 },
  { label: "320K", value: 320 },
  { label: "无损 16bit", value: 740 },
  { label: "无损 24bit", value: 999 },
];
