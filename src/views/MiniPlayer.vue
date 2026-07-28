<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { NButton } from "naive-ui";
import type { PlayerSnapshot } from "../types/music";
import Icon from "../components/Icon.vue";

const state = ref<PlayerSnapshot | null>(null);
let unlisten: (() => void) | null = null;

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

onMounted(async () => {
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
  unlisten?.();
});
</script>

<template>
  <div
    class="h-screen w-screen flex items-center gap-3 px-3 bg-[#1a1a22] text-white select-none border border-white/10"
    data-tauri-drag-region
  >
    <div
      class="w-14 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0 flex items-center justify-center"
    >
      <img
        v-if="state?.track?.picUrl"
        :src="state.track.picUrl"
        class="w-full h-full object-cover"
        alt=""
      />
      <Icon v-else name="ri:music-2-line" :size="22" color="rgba(255,255,255,0.3)" />
    </div>
    <div class="flex-1 min-w-0" data-tauri-drag-region>
      <div class="truncate text-sm font-medium">
        {{ state?.track?.name || "未播放" }}
      </div>
      <div class="truncate text-xs text-white/45 mt-0.5">
        {{ (state?.track?.artist || []).join(" / ") || "—" }}
      </div>
    </div>
    <div class="flex items-center gap-1">
      <NButton quaternary circle size="small" @click="emitCmd('prev')">
        <Icon name="ri:skip-back-fill" :size="18" />
      </NButton>
      <NButton type="primary" circle size="small" @click="emitCmd('toggle')">
        <Icon :name="state?.playing ? 'ri:pause-fill' : 'ri:play-fill'" :size="18" />
      </NButton>
      <NButton quaternary circle size="small" @click="emitCmd('next')">
        <Icon name="ri:skip-forward-fill" :size="18" />
      </NButton>
      <NButton quaternary circle size="tiny" @click="closeMini">
        <Icon name="ri:close-line" :size="14" />
      </NButton>
    </div>
  </div>
</template>
