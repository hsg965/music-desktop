<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { PlayerSnapshot } from "../types/music";
import { findLyricIndex, parseLrc } from "../utils/lrc";
import Icon from "../components/Icon.vue";

const state = ref<PlayerSnapshot | null>(null);
const hovered = ref(false);
let unlisten: (() => void) | null = null;

const lines = computed(() => parseLrc(state.value?.lyricText || ""));
const tlines = computed(() => parseLrc(state.value?.tlyricText || ""));
const activeIndex = computed(() =>
  findLyricIndex(lines.value, state.value?.currentTime || 0),
);
const currentLine = computed(() => {
  if (activeIndex.value < 0) return state.value?.track?.name || "桌面歌词";
  return lines.value[activeIndex.value]?.text || "♪";
});
const currentT = computed(() => {
  if (activeIndex.value < 0) return "";
  const time = lines.value[activeIndex.value]?.time ?? 0;
  const idx = findLyricIndex(tlines.value, time);
  return idx >= 0 ? tlines.value[idx]?.text : "";
});

const artist = computed(
  () => (state.value?.track?.artist || []).join(" / ") || "",
);

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

onMounted(async () => {
  // 透明窗口：去掉全局深色背景
  document.documentElement.classList.add("lyric-window");
  document.body.classList.add("lyric-window");

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
  unlisten?.();
});
</script>

<template>
  <div
    class="lyric-root h-screen w-screen flex flex-col items-center justify-center relative select-none px-3 py-2 transition-colors duration-200"
    :class="{ 'is-hover': hovered }"
    data-tauri-drag-region
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <!-- 悬停时显示的背景层 -->
    <div class="lyric-bg absolute inset-0 rounded-2xl pointer-events-none" />

    <!-- 顶部：曲目信息 + 关闭 -->
    <div
      class="relative z-1 w-full flex items-center justify-between gap-2 mb-1 min-h-6 transition-opacity duration-200"
      :class="hovered ? 'opacity-100' : 'opacity-0'"
    >
      <div class="min-w-0 flex-1 px-2" data-tauri-drag-region>
        <div class="truncate text-xs text-white/90 font-medium">
          {{ state?.track?.name || "未播放" }}
          <span v-if="artist" class="text-white/50 font-normal"> · {{ artist }}</span>
        </div>
      </div>
      <button
        class="ctrl-btn shrink-0"
        title="关闭"
        @click.stop="closeWin"
      >
        <Icon name="ri:close-line" :size="14" />
      </button>
    </div>

    <!-- 歌词 -->
    <div
      class="relative z-1 text-center px-4 leading-snug max-w-full"
      data-tauri-drag-region
    >
      <div class="lyric-text text-xl font-semibold truncate max-w-[680px]">
        {{ currentLine }}
      </div>
      <div
        v-if="currentT"
        class="lyric-sub text-sm mt-0.5 truncate max-w-[680px] opacity-80"
      >
        {{ currentT }}
      </div>
    </div>

    <!-- 底部播放控制：默认半透明可见，悬停更清晰 -->
    <div
      class="relative z-1 flex items-center gap-1 mt-2 transition-opacity duration-200"
      :class="hovered ? 'opacity-100' : 'opacity-70'"
    >
      <button class="ctrl-btn" title="上一首" @click.stop="emitCmd('prev')">
        <Icon name="ri:skip-back-fill" :size="18" />
      </button>
      <button
        class="ctrl-btn ctrl-btn-main"
        title="播放/暂停"
        @click.stop="emitCmd('toggle')"
      >
        <Icon
          :name="state?.playing ? 'ri:pause-fill' : 'ri:play-fill'"
          :size="20"
        />
      </button>
      <button class="ctrl-btn" title="下一首" @click.stop="emitCmd('next')">
        <Icon name="ri:skip-forward-fill" :size="18" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.lyric-root {
  background: transparent;
}

.lyric-bg {
  background: transparent;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.lyric-root.is-hover .lyric-bg {
  background: rgba(18, 18, 24, 0.78);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(12px);
}

.lyric-text {
  color: #f5f0ff;
  text-shadow:
    0 0 8px rgba(0, 0, 0, 0.9),
    0 2px 6px rgba(0, 0, 0, 0.75);
}

.lyric-sub {
  color: rgba(255, 255, 255, 0.85);
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
}

.ctrl-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.lyric-root.is-hover .ctrl-btn {
  background: rgba(255, 255, 255, 0.12);
}

.ctrl-btn:hover {
  background: rgba(124, 106, 247, 0.55) !important;
  transform: scale(1.05);
}

.ctrl-btn-main {
  width: 36px;
  height: 36px;
  background: rgba(124, 106, 247, 0.75);
}

.ctrl-btn-main:hover {
  background: rgba(124, 106, 247, 0.95) !important;
}
</style>

<style>
/* 桌面歌词窗口：全局透明，否则 WebView 会盖死透明窗 */
html.lyric-window,
body.lyric-window,
.lyric-window #app {
  background: transparent !important;
  background-color: transparent !important;
}
</style>
