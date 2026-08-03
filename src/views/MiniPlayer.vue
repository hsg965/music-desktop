<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import type { PlayerSnapshot } from "../types/music";
import Icon from "../components/Icon.vue";
import { applySkin } from "../themes/apply";
import { formatTime } from "../utils/lrc";

const state = ref<PlayerSnapshot | null>(null);
let unlisten: (() => void) | null = null;
let skinTimer: number | null = null;

const artist = computed(
  () => (state.value?.track?.artist || []).join(" / ") || "—",
);

const progress = computed(() => {
  const d = state.value?.duration || 0;
  const t = state.value?.currentTime || 0;
  if (d <= 0) return 0;
  return Math.min(100, (t / d) * 100);
});

async function emitCmd(cmd: string) {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("player:cmd", cmd);
  } catch {
    // ignore
  }
}

async function closeMini() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    // ignore
  }
}

function syncSkinFromStorage() {
  try {
    const raw = localStorage.getItem("music-desktop-settings");
    if (!raw) return;
    const id = JSON.parse(raw).skinId as string;
    if (id) applySkin(id);
  } catch {
    // ignore
  }
}

onMounted(async () => {
  syncSkinFromStorage();
  skinTimer = window.setInterval(syncSkinFromStorage, 1500);
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
  if (skinTimer != null) window.clearInterval(skinTimer);
  unlisten?.();
});
</script>

<template>
  <div class="mini app-shell" data-tauri-drag-region>
    <div class="progress" aria-hidden="true">
      <div class="progress-fill" :style="{ width: progress + '%' }" />
    </div>

    <div class="body">
      <div class="cover">
        <img
          v-if="state?.track?.picUrl"
          :src="state.track.picUrl"
          alt=""
          referrerpolicy="no-referrer"
        />
        <Icon v-else name="ri:music-2-line" :size="20" />
      </div>

      <div class="meta" data-tauri-drag-region>
        <div class="name truncate">{{ state?.track?.name || "未播放" }}</div>
        <div class="artist truncate">{{ artist }}</div>
        <div class="time">
          {{ formatTime(state?.currentTime || 0) }}
          <span class="slash">/</span>
          {{ formatTime(state?.duration || 0) }}
        </div>
      </div>

      <div class="controls no-drag">
        <button type="button" class="btn" title="上一首" @click="emitCmd('prev')">
          <Icon name="ri:skip-back-fill" :size="16" />
        </button>
        <button
          type="button"
          class="btn btn-main"
          title="播放/暂停"
          @click="emitCmd('toggle')"
        >
          <Icon
            :name="state?.playing ? 'ri:pause-fill' : 'ri:play-fill'"
            :size="18"
          />
        </button>
        <button type="button" class="btn" title="下一首" @click="emitCmd('next')">
          <Icon name="ri:skip-forward-fill" :size="16" />
        </button>
        <button type="button" class="btn btn-close" title="关闭" @click="closeMini">
          <Icon name="ri:close-line" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini {
  height: 100vh;
  width: 100vw;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
  overflow: hidden;
  user-select: none;
}

.progress {
  height: 2px;
  background: var(--surface-2);
  flex-shrink: 0;
}

.progress-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.25s linear;
}

.body {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px 0 8px;
  background: var(--bar-bg);
  backdrop-filter: blur(var(--panel-blur)) saturate(var(--glass-saturate, 1.35));
  -webkit-backdrop-filter: blur(var(--panel-blur))
    saturate(var(--glass-saturate, 1.35));
}

.cover {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  color: var(--text-faint);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.3;
}

.artist {
  margin-top: 2px;
  font-size: 11px;
  color: var(--text-faint);
  line-height: 1.3;
}

.time {
  margin-top: 3px;
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  color: var(--text-faint);
}

.slash {
  margin: 0 2px;
  opacity: 0.6;
}

.controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.no-drag {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}

.btn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.btn-main {
  width: 34px;
  height: 34px;
  background: var(--primary);
  color: #fff;
}

.btn-main:hover {
  background: var(--primary-hover);
  color: #fff;
  opacity: 1;
  transform: scale(1.04);
}

.btn-close:hover {
  background: #e81123;
  color: #fff;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
