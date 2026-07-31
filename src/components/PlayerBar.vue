<script setup lang="ts">
import { computed } from "vue";
import { NButton, NSlider, NTooltip, NSpin } from "naive-ui";
import { usePlayerStore } from "../stores/player";
import { useSettingsStore } from "../stores/settings";
import { formatTime } from "../utils/lrc";
import { openDesktopLyric, openMiniPlayer } from "../utils/windows";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";
import { useImmersiveLyric } from "../composables/useImmersiveLyric";

const player = usePlayerStore();
const settings = useSettingsStore();
const { open: openDownload } = useDownloadModal();
const { open: lyricOpen, toggle: toggleImmersiveLyric } = useImmersiveLyric();

const artist = computed(
  () => (player.currentTrack?.artist || []).join(" / ") || "未知歌手",
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

function openNowPlaying() {
  toggleImmersiveLyric();
}
</script>

<template>
  <footer class="player-bar">
    <!-- 左：当前曲目 → 点击进入沉浸歌词 -->
    <div class="pb-left">
      <button
        type="button"
        class="now-playing"
        :class="{ active: lyricOpen }"
        title="打开歌词"
        @click="openNowPlaying"
      >
        <div class="player-cover cover">
          <img
            v-if="player.currentTrack?.picUrl"
            :src="player.currentTrack.picUrl"
            class="cover-img"
            alt=""
            referrerpolicy="no-referrer"
          />
          <Icon
            v-else
            name="ri:music-2-line"
            :size="22"
            color="var(--text-faint)"
          />
          <span class="cover-hint">
            <Icon
              :name="lyricOpen ? 'ri:arrow-down-s-line' : 'ri:arrow-up-s-line'"
              :size="16"
            />
          </span>
        </div>
        <div class="meta min-w-0">
          <div class="name truncate">
            {{ player.currentTrack?.name || "未播放" }}
          </div>
          <div class="artist truncate">
            {{ player.currentTrack ? artist : "从热榜或搜索开始" }}
          </div>
        </div>
      </button>
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

    <!-- 中：控制 + 进度 -->
    <div class="pb-center">
      <div class="controls">
        <NTooltip>
          <template #trigger>
            <button type="button" class="ctl-btn" @click="player.cycleMode()">
              <Icon :name="modeIcon" :size="16" />
            </button>
          </template>
          {{ modeTip }}
        </NTooltip>
        <button type="button" class="ctl-btn" @click="player.prev()">
          <Icon name="ri:skip-back-fill" :size="20" />
        </button>
        <button
          type="button"
          class="ctl-play"
          :disabled="!player.currentTrack"
          @click="player.toggle()"
        >
          <Icon
            :name="player.playing ? 'ri:pause-fill' : 'ri:play-fill'"
            :size="22"
          />
        </button>
        <button type="button" class="ctl-btn" @click="player.next()">
          <Icon name="ri:skip-forward-fill" :size="20" />
        </button>
        <NTooltip>
          <template #trigger>
            <button type="button" class="ctl-btn" @click="toggleLyricWin">
              <Icon name="ri:text" :size="16" />
            </button>
          </template>
          桌面歌词
        </NTooltip>
      </div>
      <div class="progress">
        <span class="time">{{ formatTime(player.currentTime) }}</span>
        <NSlider
          class="progress-slider"
          :value="player.currentTime"
          :min="0"
          :max="player.duration || 1"
          :step="0.1"
          :tooltip="false"
          @update:value="onSeek"
        />
        <span class="time">{{ formatTime(player.duration) }}</span>
      </div>
    </div>

    <!-- 右：音量与窗口 -->
    <div class="pb-right">
      <NTooltip>
        <template #trigger>
          <button type="button" class="ctl-btn" @click="toggleMini">
            <Icon name="ri:picture-in-picture-2-line" :size="16" />
          </button>
        </template>
        迷你窗
      </NTooltip>
      <Icon
        :name="settings.volume === 0 ? 'ri:volume-mute-line' : 'ri:volume-up-line'"
        :size="16"
        color="var(--text-muted)"
      />
      <NSlider
        class="vol-slider"
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

<style scoped>
.player-bar {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) minmax(280px, 1.4fr) minmax(160px, 1fr);
  align-items: center;
  gap: 12px;
  padding: 0 16px;
}

.pb-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
  border: none;
  background: transparent;
  padding: 4px 8px 4px 4px;
  margin: 0;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition: background 0.12s;
}

.now-playing:hover {
  background: var(--surface-2);
}

.now-playing.active {
  background: var(--primary-soft);
}

.cover {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  overflow: hidden;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  opacity: 0;
  transition: opacity 0.15s;
}

.now-playing:hover .cover-hint,
.now-playing.active .cover-hint {
  opacity: 1;
}

.meta {
  min-width: 0;
  flex: 1;
}

.name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.artist {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-faint);
}

.pb-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ctl-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}

.ctl-btn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.ctl-play {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: var(--text);
  color: var(--bg);
  cursor: pointer;
  transition:
    transform 0.12s,
    opacity 0.12s;
}

.ctl-play:hover:not(:disabled) {
  transform: scale(1.06);
}

.ctl-play:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

html[data-mode="light"] .ctl-play {
  background: var(--text);
  color: #fff;
}

.progress {
  width: 100%;
  max-width: 520px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.time {
  width: 36px;
  font-size: 11px;
  tabular-nums: true;
  font-variant-numeric: tabular-nums;
  color: var(--text-faint);
  text-align: center;
  flex-shrink: 0;
}

.progress-slider {
  flex: 1;
}

.pb-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.vol-slider {
  width: 100px;
  max-width: 28vw;
}

@media (max-width: 900px) {
  .player-bar {
    grid-template-columns: 1fr 1.2fr auto;
  }
  .vol-slider {
    width: 72px;
  }
}
</style>
