import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type { Bitrate, MusicSource } from "../types/music";

const STORAGE_KEY = "music-desktop-settings";

export interface AppSettings {
  source: MusicSource;
  bitrate: Bitrate;
  volume: number;
  closeToTray: boolean;
  desktopLyric: boolean;
  miniPlayer: boolean;
}

const defaults: AppSettings = {
  source: "netease",
  bitrate: 320,
  volume: 0.8,
  closeToTray: true,
  desktopLyric: false,
  miniPlayer: false,
};

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
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

  function persist() {
    const data: AppSettings = {
      source: source.value,
      bitrate: bitrate.value,
      volume: volume.value,
      closeToTray: closeToTray.value,
      desktopLyric: desktopLyric.value,
      miniPlayer: miniPlayer.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  watch(
    [source, bitrate, volume, closeToTray, desktopLyric, miniPlayer],
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
    persist,
  };
});
