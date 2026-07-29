<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import type { PlayerSnapshot } from "../types/music";
import Icon from "../components/Icon.vue";
import { applySkin } from "../themes/apply";

const state = ref<PlayerSnapshot | null>(null);
let unlisten: (() => void) | null = null;
let skinTimer: number | null = null;

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
  <div class="mini-root h-screen w-screen flex items-center gap-3 px-3 select-none" data-tauri-drag-region>
    <div class="cover shrink-0 flex items-center justify-center overflow-hidden">
      <img
        v-if="state?.track?.picUrl"
        :src="state.track.picUrl"
        class="w-full h-full object-cover"
        alt=""
      />
      <Icon v-else name="ri:music-2-line" :size="22" color="var(--text-faint)" />
    </div>
    <div class="flex-1 min-w-0" data-tauri-drag-region>
      <div class="truncate text-sm font-medium title">
        {{ state?.track?.name || "未播放" }}
      </div>
      <div class="truncate text-xs mt-0.5 artist">
        {{ (state?.track?.artist || []).join(" / ") || "—" }}
      </div>
    </div>
    <div class="flex items-center gap-1">
      <button class="ctrl-btn" title="上一首" @click="emitCmd('prev')">
        <Icon name="ri:skip-back-fill" :size="18" />
      </button>
      <button class="ctrl-btn ctrl-btn-main" title="播放/暂停" @click="emitCmd('toggle')">
        <Icon :name="state?.playing ? 'ri:pause-fill' : 'ri:play-fill'" :size="18" />
      </button>
      <button class="ctrl-btn" title="下一首" @click="emitCmd('next')">
        <Icon name="ri:skip-forward-fill" :size="18" />
      </button>
      <button class="ctrl-btn" title="关闭" @click="closeMini">
        <Icon name="ri:close-line" :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.mini-root {
  background: var(--bar-bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.cover {
  width: 56px;
  height: 56px;
  border-radius: var(--cover-radius, 12px);
  background: var(--surface-2);
  border: 1px solid var(--border);
}

.title {
  color: var(--text);
}
.artist {
  color: var(--text-muted);
}

.ctrl-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--primary);
  border-radius: 999px;
  color: var(--primary);
  background: transparent;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
}
.ctrl-btn:hover {
  background: var(--primary);
  color: #fff;
}
.ctrl-btn-main {
  background: transparent;
  box-shadow: var(--glow);
}
</style>
