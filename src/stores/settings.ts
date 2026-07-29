import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { Bitrate, MusicSource } from "../types/music";
import type { SkinId } from "../themes/types";
import { DEFAULT_SKIN_ID } from "../themes/registry";
import { applySkin } from "../themes/apply";

const STORAGE_KEY = "music-desktop-settings";

/** 歌词提前显示默认秒数 */
export const DEFAULT_LYRIC_LOOKAHEAD = 0.9;

export interface AppSettings {
  source: MusicSource;
  bitrate: Bitrate;
  volume: number;
  closeToTray: boolean;
  desktopLyric: boolean;
  miniPlayer: boolean;
  skinId: SkinId;
  /** 歌词提前量（秒），正数=提前显示，0=严格按时间戳 */
  lyricLookAhead: number;
}

const defaults: AppSettings = {
  source: "netease",
  bitrate: 320,
  volume: 0.8,
  closeToTray: true,
  desktopLyric: false,
  miniPlayer: false,
  skinId: DEFAULT_SKIN_ID,
  lyricLookAhead: DEFAULT_LYRIC_LOOKAHEAD,
};

function clampLookAhead(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_LYRIC_LOOKAHEAD;
  return Math.min(3, Math.max(0, Math.round(n * 20) / 20)); // 0~3，步进 0.05
}

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      ...defaults,
      ...parsed,
      lyricLookAhead: clampLookAhead(
        parsed.lyricLookAhead ?? DEFAULT_LYRIC_LOOKAHEAD,
      ),
    };
  } catch {
    return { ...defaults };
  }
}

export function readLyricLookAheadFromStorage(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LYRIC_LOOKAHEAD;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return clampLookAhead(parsed.lyricLookAhead ?? DEFAULT_LYRIC_LOOKAHEAD);
  } catch {
    return DEFAULT_LYRIC_LOOKAHEAD;
  }
}

export const useSettingsStore = defineStore("settings", () => {
  const initial = load();
  const source = ref<MusicSource>(initial.source);
  const bitrate = ref<Bitrate>(initial.bitrate);
  const volume = ref(initial.volume);
  const closeToTray = ref(initial.closeToTray);
  const desktopLyric = ref(initial.desktopLyric);
  const miniPlayer = ref(initial.miniPlayer);
  const skinId = ref<SkinId>(initial.skinId || DEFAULT_SKIN_ID);
  const lyricLookAhead = ref(
    clampLookAhead(initial.lyricLookAhead ?? DEFAULT_LYRIC_LOOKAHEAD),
  );

  applySkin(skinId.value);

  function persist() {
    const data: AppSettings = {
      source: source.value,
      bitrate: bitrate.value,
      volume: volume.value,
      closeToTray: closeToTray.value,
      desktopLyric: desktopLyric.value,
      miniPlayer: miniPlayer.value,
      skinId: skinId.value,
      lyricLookAhead: clampLookAhead(lyricLookAhead.value),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setSkin(id: SkinId) {
    skinId.value = id;
    applySkin(id);
  }

  function setLyricLookAhead(v: number) {
    lyricLookAhead.value = clampLookAhead(v);
  }

  watch(
    [
      source,
      bitrate,
      volume,
      closeToTray,
      desktopLyric,
      miniPlayer,
      skinId,
      lyricLookAhead,
    ],
    persist,
    { deep: true },
  );

  return {
    source,
    bitrate,
    volume,
    closeToTray,
    desktopLyric,
    miniPlayer,
    skinId,
    lyricLookAhead,
    setSkin,
    setLyricLookAhead,
    persist,
  };
});
