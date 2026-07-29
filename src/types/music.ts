/** 音乐源 */
export type MusicSource =
  | "netease"
  | "tencent"
  | "kuwo"
  | "tidal"
  | "qobuz"
  | "joox"
  | "bilibili"
  | "apple"
  | "ytmusic"
  | "spotify";

/** 音质 br */
export type Bitrate = 128 | 192 | 320 | 740 | 999;

/**
 * 搜索类别（对应 API source 用法）
 * - song/artist：types=search&source=netease
 * - album：types=search&source=netease_album（高级：专辑曲目）
 */
export type SearchKind = "song" | "artist" | "album";

/** 搜索结果曲目 */
export interface Track {
  id: string | number;
  name: string;
  artist: string[];
  album: string;
  pic_id: string | number;
  url_id?: string | number;
  lyric_id: string | number;
  source: MusicSource | string;
  /** 来自哪种搜索类别 */
  searchKind?: SearchKind;
  /** 运行时填充 */
  picUrl?: string;
  url?: string;
}

export interface UrlResult {
  url: string;
  br: number;
  size: number;
}

export interface PicResult {
  url: string;
}

export interface LyricResult {
  lyric: string;
  tlyric?: string;
}

export type PlayMode = "list" | "single" | "order";

export interface PlayerSnapshot {
  track: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  mode: PlayMode;
  queue: Track[];
  currentIndex: number;
  lyricText: string;
  tlyricText: string;
}
