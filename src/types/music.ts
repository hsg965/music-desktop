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

/** 官方热榜配置 */
export interface ChartInfo {
  id: string;
  name: string;
}

/** 歌单 / 热榜详情（归一化后） */
export interface PlaylistDetail {
  id: string | number;
  name: string;
  description: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  updateTime: number;
  tracks: Track[];
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
