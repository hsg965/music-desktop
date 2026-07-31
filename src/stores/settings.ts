import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { Bitrate, MusicSource } from "../types/music";
import type { SkinId } from "../themes/types";
import { DEFAULT_SKIN_ID, resolveSkinId } from "../themes/registry";
import { applySkin } from "../themes/apply";

const STORAGE_KEY = "music-desktop-settings";

/** 歌词提前显示默认秒数 */
export const DEFAULT_LYRIC_LOOKAHEAD = 0.9;

/** 桌面歌词默认字号 */
export const DEFAULT_DESKTOP_LYRIC_FONT_SIZE = 26;

/** 桌面歌词自定义颜色默认值 */
export const DEFAULT_DESKTOP_LYRIC_COLOR = "#ffffff";

export type DesktopLyricColorMode = "theme" | "custom";

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
  /** 桌面歌词颜色：跟随主题 / 自定义 */
  desktopLyricColorMode: DesktopLyricColorMode;
  /** 自定义颜色（hex） */
  desktopLyricColor: string;
  /** 桌面歌词主字号 */
  desktopLyricFontSize: number;
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
  desktopLyricColorMode: "theme",
  desktopLyricColor: DEFAULT_DESKTOP_LYRIC_COLOR,
  desktopLyricFontSize: DEFAULT_DESKTOP_LYRIC_FONT_SIZE,
};

function clampLookAhead(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_LYRIC_LOOKAHEAD;
  return Math.min(3, Math.max(0, Math.round(n * 20) / 20)); // 0~3，步进 0.05
}

function clampFontSize(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_DESKTOP_LYRIC_FONT_SIZE;
  return Math.min(56, Math.max(14, Math.round(n)));
}

function normalizeColor(v: unknown): string {
  if (typeof v !== "string") return DEFAULT_DESKTOP_LYRIC_COLOR;
  const s = v.trim();
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(s)) return s;
  if (/^rgba?\(/i.test(s)) return s;
  return DEFAULT_DESKTOP_LYRIC_COLOR;
}

function normalizeColorMode(v: unknown): DesktopLyricColorMode {
  return v === "custom" ? "custom" : "theme";
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
      desktopLyricColorMode: normalizeColorMode(parsed.desktopLyricColorMode),
      desktopLyricColor: normalizeColor(
        parsed.desktopLyricColor ?? DEFAULT_DESKTOP_LYRIC_COLOR,
      ),
      desktopLyricFontSize: clampFontSize(
        parsed.desktopLyricFontSize ?? DEFAULT_DESKTOP_LYRIC_FONT_SIZE,
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

/** 桌面歌词窗口读取外观设置（与主窗 localStorage 同步） */
export function readDesktopLyricAppearanceFromStorage(): {
  colorMode: DesktopLyricColorMode;
  color: string;
  fontSize: number;
  skinId?: string;
  lyricLookAhead: number;
} {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        colorMode: "theme",
        color: DEFAULT_DESKTOP_LYRIC_COLOR,
        fontSize: DEFAULT_DESKTOP_LYRIC_FONT_SIZE,
        lyricLookAhead: DEFAULT_LYRIC_LOOKAHEAD,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      colorMode: normalizeColorMode(parsed.desktopLyricColorMode),
      color: normalizeColor(parsed.desktopLyricColor),
      fontSize: clampFontSize(parsed.desktopLyricFontSize),
      skinId: parsed.skinId,
      lyricLookAhead: clampLookAhead(
        parsed.lyricLookAhead ?? DEFAULT_LYRIC_LOOKAHEAD,
      ),
    };
  } catch {
    return {
      colorMode: "theme",
      color: DEFAULT_DESKTOP_LYRIC_COLOR,
      fontSize: DEFAULT_DESKTOP_LYRIC_FONT_SIZE,
      lyricLookAhead: DEFAULT_LYRIC_LOOKAHEAD,
    };
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
  const skinId = ref<SkinId>(resolveSkinId(initial.skinId || DEFAULT_SKIN_ID));
  const lyricLookAhead = ref(
    clampLookAhead(initial.lyricLookAhead ?? DEFAULT_LYRIC_LOOKAHEAD),
  );
  const desktopLyricColorMode = ref<DesktopLyricColorMode>(
    normalizeColorMode(initial.desktopLyricColorMode),
  );
  const desktopLyricColor = ref(
    normalizeColor(initial.desktopLyricColor),
  );
  const desktopLyricFontSize = ref(
    clampFontSize(initial.desktopLyricFontSize),
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
      desktopLyricColorMode: normalizeColorMode(desktopLyricColorMode.value),
      desktopLyricColor: normalizeColor(desktopLyricColor.value),
      desktopLyricFontSize: clampFontSize(desktopLyricFontSize.value),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function setSkin(id: SkinId | string) {
    const resolved = resolveSkinId(id);
    skinId.value = resolved;
    applySkin(resolved);
  }

  function setLyricLookAhead(v: number) {
    lyricLookAhead.value = clampLookAhead(v);
  }

  function setDesktopLyricColorMode(mode: DesktopLyricColorMode) {
    desktopLyricColorMode.value = normalizeColorMode(mode);
  }

  function setDesktopLyricColor(color: string) {
    desktopLyricColor.value = normalizeColor(color);
  }

  function setDesktopLyricFontSize(size: number) {
    desktopLyricFontSize.value = clampFontSize(size);
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
      desktopLyricColorMode,
      desktopLyricColor,
      desktopLyricFontSize,
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
    desktopLyricColorMode,
    desktopLyricColor,
    desktopLyricFontSize,
    setSkin,
    setLyricLookAhead,
    setDesktopLyricColorMode,
    setDesktopLyricColor,
    setDesktopLyricFontSize,
    persist,
  };
});
