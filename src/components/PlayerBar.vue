<script setup lang="ts">
import { computed } from "vue";
import { NButton, NSlider, NTooltip, NSpin } from "naive-ui";
import { usePlayerStore } from "../stores/player";
import { useSettingsStore } from "../stores/settings";
import { formatTime } from "../utils/lrc";
import { openDesktopLyric, openMiniPlayer } from "../utils/windows";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";

const player = usePlayerStore();
const settings = useSettingsStore();
const { open: openDownload } = useDownloadModal();

const artist = computed(() =>
  (player.currentTrack?.artist || []).join(" / ") || "未知歌手",
);

const modeIcon = computed(() => {
  if (player.mode === "single") return "ri:repeat-one-fill";
  if (player.mode === "order") return "ri:order-play-fill";
  return "ri:repeat-fill";
});

const modeTip = computed(() => {
  if (player.mode === "single") return "单曲循环";
  if (player.mode === "order") return "顺序播放";
  return "列表循环";
});

function onSeek(v: number) {
  player.seek(v);
}

function onVolume(v: number) {
  player.setVolume(v);
}

async function toggleMini() {
  settings.miniPlayer = true;
  await openMiniPlayer();
}

async function toggleLyricWin() {
  settings.desktopLyric = true;
  await openDesktopLyric();
}
</script>

<template>
  <footer
    class="player-bar px-4 flex items-center gap-4 border-t"
    style="
      height: var(--player-height);
      background: var(--bar-bg);
      border-color: var(--border);
      color: var(--text);
    "
  >
    <div class="player-track-info w-56 flex items-center gap-3 min-w-0">
      <div
        class="player-cover w-12 h-12 shrink-0 flex items-center justify-center"
        style="background: var(--surface-2)"
      >
        <img
          v-if="player.currentTrack?.picUrl"
          :src="player.currentTrack.picUrl"
          class="w-full h-full object-cover"
          alt=""
        />
        <Icon
          v-else
          name="ri:music-2-line"
          :size="22"
          color="var(--text-faint)"
        />
      </div>
      <div class="min-w-0">
        <div class="truncate text-sm" style="color: var(--text)">
          {{ player.currentTrack?.name || "未播放" }}
        </div>
        <div class="truncate text-xs mt-0.5" style="color: var(--text-faint)">
          {{ player.currentTrack ? artist : "搜索并选择一首歌" }}
        </div>
      </div>
      <NTooltip v-if="player.currentTrack">
        <template #trigger>
          <NButton
            quaternary
            circle
            size="small"
            @click="openDownload(player.currentTrack!)"
          >
            <Icon name="ri:download-2-line" :size="16" />
          </NButton>
        </template>
        下载
      </NTooltip>
      <NSpin v-if="player.loading" :size="16" />
    </div>

    <div class="flex-1 flex flex-col items-center gap-1 min-w-0">
      <div class="flex items-center gap-2">
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle size="small" @click="player.cycleMode()">
              <Icon :name="modeIcon" :size="16" />
            </NButton>
          </template>
          {{ modeTip }}
        </NTooltip>
        <NButton quaternary circle @click="player.prev()">
          <Icon name="ri:skip-back-fill" :size="20" />
        </NButton>
        <NButton
          type="primary"
          circle
          class="w-10! h-10!"
          :disabled="!player.currentTrack"
          @click="player.toggle()"
        >
          <Icon
            :name="player.playing ? 'ri:pause-fill' : 'ri:play-fill'"
            :size="22"
          />
        </NButton>
        <NButton quaternary circle @click="player.next()">
          <Icon name="ri:skip-forward-fill" :size="20" />
        </NButton>
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle size="small" @click="toggleLyricWin">
              <Icon name="ri:text" :size="16" />
            </NButton>
          </template>
          桌面歌词
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle size="small" @click="toggleMini">
              <Icon name="ri:picture-in-picture-2-line" :size="16" />
            </NButton>
          </template>
          迷你窗
        </NTooltip>
      </div>
      <div class="w-full max-w-xl flex items-center gap-2 px-2">
        <span
          class="text-xs w-10 text-right tabular-nums"
          style="color: var(--text-faint)"
        >
          {{ formatTime(player.currentTime) }}
        </span>
        <NSlider
          class="flex-1"
          :value="player.currentTime"
          :min="0"
          :max="player.duration || 1"
          :step="0.1"
          :tooltip="false"
          @update:value="onSeek"
        />
        <span class="text-xs w-10 tabular-nums" style="color: var(--text-faint)">
          {{ formatTime(player.duration) }}
        </span>
      </div>
    </div>

    <div class="w-36 flex items-center gap-2">
      <Icon
        :name="settings.volume === 0 ? 'ri:volume-mute-line' : 'ri:volume-up-line'"
        :size="16"
        color="var(--text-muted)"
      />
      <NSlider
        :value="settings.volume"
        :min="0"
        :max="1"
        :step="0.01"
        :tooltip="false"
        @update:value="onVolume"
      />
    </div>
  </footer>
</template>
