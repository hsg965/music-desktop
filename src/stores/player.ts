import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { fetchLyric, fetchPicUrl, fetchPlayUrl } from "../api/music";
import type { PlayMode, PlayerSnapshot, Track } from "../types/music";
import { useSettingsStore } from "./settings";

const QUEUE_KEY = "music-desktop-queue";

function loadQueue(): Track[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

let audio: HTMLAudioElement | null = null;
let broadcastTimer: number | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "auto";
  }
  return audio;
}

export const usePlayerStore = defineStore("player", () => {
  const settings = useSettingsStore();

  const queue = ref<Track[]>(loadQueue());
  const currentIndex = ref(-1);
  const playing = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const mode = ref<PlayMode>("list");
  const loading = ref(false);
  const error = ref("");
  const lyricText = ref("");
  const tlyricText = ref("");

  const currentTrack = computed(() =>
    currentIndex.value >= 0 ? queue.value[currentIndex.value] ?? null : null,
  );

  function saveQueue() {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.value));
  }

  watch(queue, saveQueue, { deep: true });

  function bindAudioEvents() {
    const el = getAudio();
    el.volume = settings.volume;

    el.ontimeupdate = () => {
      currentTime.value = el.currentTime;
      scheduleBroadcast();
    };
    el.onloadedmetadata = () => {
      duration.value = el.duration || 0;
    };
    el.onplay = () => {
      playing.value = true;
      broadcastState();
    };
    el.onpause = () => {
      playing.value = false;
      broadcastState();
    };
    el.onended = () => {
      onEnded();
    };
    el.onerror = () => {
      error.value = "播放失败，可能链接已失效或音源不可用";
      playing.value = false;
      broadcastState();
    };
  }

  bindAudioEvents();

  function snapshot(): PlayerSnapshot {
    return {
      track: currentTrack.value,
      playing: playing.value,
      currentTime: currentTime.value,
      duration: duration.value,
      volume: settings.volume,
      mode: mode.value,
      queue: queue.value,
      currentIndex: currentIndex.value,
      lyricText: lyricText.value,
      tlyricText: tlyricText.value,
    };
  }

  async function broadcastState() {
    try {
      const { emit } = await import("@tauri-apps/api/event");
      await emit("player:state", snapshot());
    } catch {
      // 浏览器预览时忽略
    }
  }

  function scheduleBroadcast() {
    if (broadcastTimer != null) return;
    broadcastTimer = window.setTimeout(() => {
      broadcastTimer = null;
      broadcastState();
    }, 400);
  }

  async function resolveTrackMedia(track: Track): Promise<boolean> {
    loading.value = true;
    error.value = "";
    try {
      const [urlRes, pic, lyric] = await Promise.all([
        fetchPlayUrl(track.id, track.source, settings.bitrate),
        fetchPicUrl(track.pic_id, track.source, 500),
        fetchLyric(track.lyric_id, track.source),
      ]);

      if (!urlRes?.url) {
        error.value = "无法获取播放地址（可能无版权或音源不可用）";
        return false;
      }

      track.url = urlRes.url;
      track.picUrl = pic;
      lyricText.value = lyric.lyric || "";
      tlyricText.value = lyric.tlyric || "";
      return true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "加载失败";
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function playAt(index: number) {
    if (index < 0 || index >= queue.value.length) return;
    currentIndex.value = index;
    const track = queue.value[index];
    const ok = await resolveTrackMedia(track);
    if (!ok) {
      playing.value = false;
      broadcastState();
      return;
    }

    const el = getAudio();
    el.src = track.url!;
    el.volume = settings.volume;
    try {
      await el.play();
      playing.value = true;
    } catch {
      error.value = "自动播放被拦截，请点击播放";
      playing.value = false;
    }
    broadcastState();
  }

  async function playTrack(track: Track, replaceQueue = false) {
    if (replaceQueue) {
      queue.value = [track];
      await playAt(0);
      return;
    }

    const key = `${track.source}-${track.id}`;
    let idx = queue.value.findIndex(
      (t) => `${t.source}-${t.id}` === key,
    );
    if (idx < 0) {
      queue.value.push({ ...track });
      idx = queue.value.length - 1;
    }
    await playAt(idx);
  }

  /** 用列表替换队列并从第一首开始播（一键播放） */
  async function playAll(tracks: Track[], startIndex = 0) {
    if (!tracks.length) return;
    queue.value = tracks.map((t) => ({ ...t }));
    const idx = Math.max(0, Math.min(startIndex, queue.value.length - 1));
    await playAt(idx);
  }

  function addToQueue(track: Track) {
    const key = `${track.source}-${track.id}`;
    if (queue.value.some((t) => `${t.source}-${t.id}` === key)) return;
    queue.value.push({ ...track });
  }

  function addManyToQueue(tracks: Track[]) {
    for (const t of tracks) addToQueue(t);
  }

  function removeFromQueue(index: number) {
    if (index < 0 || index >= queue.value.length) return;
    queue.value.splice(index, 1);
    if (currentIndex.value === index) {
      stop();
      currentIndex.value = -1;
    } else if (currentIndex.value > index) {
      currentIndex.value -= 1;
    }
    broadcastState();
  }

  function clearQueue() {
    stop();
    queue.value = [];
    currentIndex.value = -1;
    lyricText.value = "";
    tlyricText.value = "";
    broadcastState();
  }

  async function toggle() {
    const el = getAudio();
    if (!currentTrack.value) return;
    if (playing.value) {
      el.pause();
    } else {
      if (!el.src && currentTrack.value) {
        await playAt(currentIndex.value);
        return;
      }
      try {
        await el.play();
      } catch {
        error.value = "播放失败";
      }
    }
  }

  function pause() {
    getAudio().pause();
  }

  function stop() {
    const el = getAudio();
    el.pause();
    el.removeAttribute("src");
    el.load();
    playing.value = false;
    currentTime.value = 0;
    duration.value = 0;
  }

  async function next() {
    if (!queue.value.length) return;
    if (mode.value === "single") {
      await playAt(currentIndex.value);
      return;
    }
    const nextIdx = currentIndex.value + 1;
    if (nextIdx >= queue.value.length) {
      if (mode.value === "list") {
        await playAt(0);
      } else {
        playing.value = false;
        broadcastState();
      }
      return;
    }
    await playAt(nextIdx);
  }

  async function prev() {
    if (!queue.value.length) return;
    if (currentTime.value > 3) {
      seek(0);
      return;
    }
    const prevIdx = currentIndex.value - 1;
    if (prevIdx < 0) {
      if (mode.value === "list") {
        await playAt(queue.value.length - 1);
      } else {
        seek(0);
      }
      return;
    }
    await playAt(prevIdx);
  }

  function seek(time: number) {
    const el = getAudio();
    el.currentTime = Math.max(0, Math.min(time, el.duration || time));
    currentTime.value = el.currentTime;
    broadcastState();
  }

  function setVolume(v: number) {
    const vol = Math.max(0, Math.min(1, v));
    settings.volume = vol;
    getAudio().volume = vol;
    broadcastState();
  }

  function setMode(m: PlayMode) {
    mode.value = m;
    broadcastState();
  }

  function cycleMode() {
    const order: PlayMode[] = ["list", "single", "order"];
    const i = order.indexOf(mode.value);
    setMode(order[(i + 1) % order.length]);
  }

  async function onEnded() {
    if (mode.value === "single") {
      await playAt(currentIndex.value);
      return;
    }
    await next();
  }

  // 托盘 / 迷你窗控制
  async function setupRemoteControl() {
    try {
      const { listen } = await import("@tauri-apps/api/event");
      await listen("player:cmd", async (event) => {
        const cmd = event.payload as string;
        if (cmd === "toggle") await toggle();
        else if (cmd === "next") await next();
        else if (cmd === "prev") await prev();
        else if (cmd === "pause") pause();
        else if (cmd === "play" && !playing.value) await toggle();
      });
    } catch {
      // ignore
    }
  }

  return {
    queue,
    currentIndex,
    currentTrack,
    playing,
    currentTime,
    duration,
    mode,
    loading,
    error,
    lyricText,
    tlyricText,
    playTrack,
    playAll,
    playAt,
    addToQueue,
    addManyToQueue,
    removeFromQueue,
    clearQueue,
    toggle,
    pause,
    stop,
    next,
    prev,
    seek,
    setVolume,
    setMode,
    cycleMode,
    snapshot,
    broadcastState,
    setupRemoteControl,
  };
});
