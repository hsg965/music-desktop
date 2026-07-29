<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { PlayerSnapshot } from "../types/music";
import { findLyricIndex, parseLrc } from "../utils/lrc";
import Icon from "../components/Icon.vue";
import { applySkin } from "../themes/apply";
import {
  DEFAULT_LYRIC_LOOKAHEAD,
  readLyricLookAheadFromStorage,
} from "../stores/settings";

const state = ref<PlayerSnapshot | null>(null);
const hovered = ref(false);
/** 与主窗口设置同步的提前量（秒） */
const lyricLookAhead = ref(DEFAULT_LYRIC_LOOKAHEAD);
let unlisten: (() => void) | null = null;
let skinTimer: number | null = null;

const lines = computed(() => parseLrc(state.value?.lyricText || ""));
const tlines = computed(() => parseLrc(state.value?.tlyricText || ""));
const activeIndex = computed(() =>
  findLyricIndex(
    lines.value,
    state.value?.currentTime || 0,
    lyricLookAhead.value,
  ),
);

const currentLine = computed(() => {
  if (!state.value?.track) return "播放音乐后显示歌词";
  // 前奏/未到第一句：显示下一句（即将唱）或歌名
  if (activeIndex.value < 0) {
    const first = lines.value.find((l) => l.text.trim());
    return first?.text || state.value.track.name || "♪";
  }
  const text = lines.value[activeIndex.value]?.text?.trim();
  // 空行（间奏标记）时看下一句有字的
  if (!text) {
    for (let i = activeIndex.value + 1; i < lines.value.length; i++) {
      if (lines.value[i].text.trim()) return lines.value[i].text;
    }
    return state.value.track.name || "♪";
  }
  return text;
});

const currentT = computed(() => {
  if (activeIndex.value < 0) return "";
  const time = lines.value[activeIndex.value]?.time ?? 0;
  const idx = findLyricIndex(tlines.value, time, lyricLookAhead.value);
  return idx >= 0 ? tlines.value[idx]?.text : "";
});

const songName = computed(() => state.value?.track?.name || "未播放");
const artist = computed(() => {
  const a = state.value?.track?.artist;
  return a?.length ? a.join(" / ") : "";
});

async function emitCmd(cmd: string) {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("player:cmd", cmd);
  } catch {
    // ignore
  }
}

async function closeWin() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    // ignore
  }
}

function syncFromStorage() {
  try {
    const raw = localStorage.getItem("music-desktop-settings");
    if (raw) {
      const data = JSON.parse(raw) as { skinId?: string };
      if (data.skinId) applySkin(data.skinId);
    }
    lyricLookAhead.value = readLyricLookAheadFromStorage();
  } catch {
    // ignore
  }
}

onMounted(async () => {
  document.documentElement.classList.add("lyric-window");
  document.body.classList.add("lyric-window");
  syncFromStorage();
  skinTimer = window.setInterval(syncFromStorage, 1500);

  try {
    const { listen } = await import("@tauri-apps/api/event");
    unlisten = await listen<PlayerSnapshot>("player:state", (e) => {
      state.value = e.payload;
    });
  } catch {
    // ignore
  }
});

onUnmounted(() => {
  document.documentElement.classList.remove("lyric-window");
  document.body.classList.remove("lyric-window");
  if (skinTimer != null) window.clearInterval(skinTimer);
  unlisten?.();
});
</script>

<template>
  <div
    class="lyric-root"
    :class="{ 'is-hover': hovered }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="drag-layer" data-tauri-drag-region />
    <div class="bg-layer" />

    <button
      type="button"
      class="btn-close no-drag"
      title="关闭"
      @click.stop="closeWin"
    >
      <Icon name="ri:close-line" :size="14" />
    </button>

    <div class="hover-chrome no-drag">
      <div class="header">
        <div class="song-name">{{ songName }}</div>
        <div v-if="artist" class="song-artist">{{ artist }}</div>
      </div>
      <div class="footer">
        <button type="button" class="btn" title="上一首" @click.stop="emitCmd('prev')">
          <Icon name="ri:skip-back-fill" :size="16" />
        </button>
        <button
          type="button"
          class="btn btn-main"
          title="播放/暂停"
          @click.stop="emitCmd('toggle')"
        >
          <Icon
            :name="state?.playing ? 'ri:pause-fill' : 'ri:play-fill'"
            :size="18"
          />
        </button>
        <button type="button" class="btn" title="下一首" @click.stop="emitCmd('next')">
          <Icon name="ri:skip-forward-fill" :size="16" />
        </button>
      </div>
    </div>

    <div class="lyric-body">
      <div class="lyric-main">{{ currentLine }}</div>
      <div v-if="currentT" class="lyric-trans">{{ currentT }}</div>
    </div>
  </div>
</template>

<style scoped>
.lyric-root {
  position: relative;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  background: transparent;
  overflow: visible;
  user-select: none;
}

.drag-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.001);
}

.bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: 12px;
  background: transparent;
  pointer-events: none;
  transition: background 0.18s ease, box-shadow 0.18s ease;
}

.lyric-root.is-hover .bg-layer {
  background: var(--bar-bg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.22);
}

.no-drag {
  position: relative;
  z-index: 3;
}

.hover-chrome {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 8px 28px 8px;
  box-sizing: border-box;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.18s ease;
}

.lyric-root.is-hover .hover-chrome {
  opacity: 1;
  pointer-events: none;
}

.lyric-root.is-hover .hover-chrome .footer,
.lyric-root.is-hover .btn-close {
  pointer-events: auto;
}

.header {
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  text-align: center;
  flex-shrink: 0;
}

.song-name {
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.song-artist {
  margin-top: 1px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  flex-shrink: 0;
  padding-bottom: 2px;
  min-height: 36px;
  overflow: visible;
}

.btn-close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 4;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.18s,
    background 0.15s,
    color 0.15s;
}

.lyric-root.is-hover .btn-close {
  opacity: 1;
  pointer-events: auto;
}

.btn-close:hover {
  background: #e81123;
  color: #fff;
}

.lyric-body {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 100%;
  text-align: center;
  pointer-events: none;
  padding: 0 8px;
  box-sizing: border-box;
}

.lyric-main,
.lyric-trans {
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

.lyric-main {
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.lyric-trans {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
}

.lyric-root.is-hover .lyric-main {
  color: var(--text);
  text-shadow: none;
}

.lyric-root.is-hover .lyric-trans {
  color: var(--text-muted);
  text-shadow: none;
}

.btn {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}

.btn:hover {
  background: var(--primary);
  color: #fff;
}

.btn-main {
  width: 34px;
  height: 34px;
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.btn-main:hover {
  background: var(--primary-hover);
  color: #fff;
}
</style>

<style>
html.lyric-window,
body.lyric-window,
.lyric-window #app {
  background: transparent !important;
  background-color: transparent !important;
  overflow: hidden !important;
  border: none !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
