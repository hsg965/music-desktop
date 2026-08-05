<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { NSlider } from "naive-ui";
import { findLyricIndex, formatTime, parseLrc } from "../utils/lrc";
import { usePlayerStore } from "../stores/player";
import { useSettingsStore } from "../stores/settings";
import { useImmersiveLyric } from "../composables/useImmersiveLyric";
import { openDesktopLyric } from "../utils/windows";
import Icon from "./Icon.vue";

const player = usePlayerStore();
const settings = useSettingsStore();
const { open, hide } = useImmersiveLyric();

const listRef = ref<HTMLElement | null>(null);
const userScrolling = ref(false);
let scrollLockTimer: number | null = null;

const lines = computed(() => parseLrc(player.lyricText));
const tlines = computed(() => parseLrc(player.tlyricText));

const lookAhead = computed(() => {
  const v = settings.lyricLookAhead;
  return typeof v === "number" && Number.isFinite(v) ? v : 0.9;
});

const activeIndex = computed(() =>
  findLyricIndex(lines.value, player.currentTime, lookAhead.value),
);

const artist = computed(
  () => (player.currentTrack?.artist || []).join(" / ") || "未知歌手",
);

const coverUrl = computed(() => player.currentTrack?.picUrl || "");

const modeIcon = computed(() => {
  if (player.mode === "single") return "ri:repeat-one-fill";
  if (player.mode === "order") return "ri:order-play-fill";
  if (player.mode === "shuffle") return "ri:shuffle-fill";
  return "ri:repeat-fill";
});

const modeTip = computed(() => {
  if (player.mode === "single") return "单曲循环";
  if (player.mode === "order") return "顺序播放";
  if (player.mode === "shuffle") return "列表随机";
  return "列表循环";
});

function tlyricAt(time: number) {
  const idx = findLyricIndex(tlines.value, time, lookAhead.value);
  return idx >= 0 ? tlines.value[idx]?.text : "";
}

function onUserScroll() {
  userScrolling.value = true;
  if (scrollLockTimer != null) window.clearTimeout(scrollLockTimer);
  scrollLockTimer = window.setTimeout(() => {
    userScrolling.value = false;
  }, 2500);
}

function scrollToActive(smooth = true) {
  if (!listRef.value || activeIndex.value < 0 || userScrolling.value) return;
  const el = listRef.value.querySelector(
    `[data-i="${activeIndex.value}"]`,
  ) as HTMLElement | null;
  el?.scrollIntoView({
    block: "center",
    behavior: smooth ? "smooth" : "auto",
  });
}

watch(activeIndex, () => {
  void nextTick(() => scrollToActive(true));
});

watch(open, (v) => {
  if (v) {
    userScrolling.value = false;
    void nextTick(() => scrollToActive(false));
  }
});

function onLineClick(time: number) {
  player.seek(time);
  userScrolling.value = false;
  void nextTick(() => scrollToActive(true));
}

function onSeek(v: number) {
  player.seek(v);
}

function onVolume(v: number) {
  player.setVolume(v);
}

async function toggleDesktopLyric() {
  settings.desktopLyric = true;
  await openDesktopLyric();
}

function onKey(e: KeyboardEvent) {
  if (!open.value) return;
  if (e.key === "Escape") {
    e.preventDefault();
    hide();
  }
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
  if (scrollLockTimer != null) window.clearTimeout(scrollLockTimer);
});
</script>

<template>
  <Transition name="lyric-fade">
    <div
      v-if="open"
      class="immersive"
      role="dialog"
      aria-modal="true"
      aria-label="沉浸式歌词"
    >
      <!-- 全屏氛围背景 -->
      <div class="bg" aria-hidden="true">
        <div
          v-if="coverUrl"
          class="bg-img"
          :style="{ backgroundImage: `url(${coverUrl})` }"
        />
        <div class="bg-fallback" />
        <div class="bg-veil" />
        <div class="bg-vignette" />
      </div>

      <!-- 顶栏：可拖拽窗口 + 退出 -->
      <header class="top-bar" data-tauri-drag-region>
        <button
          type="button"
          class="icon-btn no-drag"
          title="收起 (Esc)"
          @click="hide"
        >
          <Icon name="ri:arrow-down-s-line" :size="26" />
        </button>
        <div class="top-center truncate" data-tauri-drag-region>
          <span class="top-kicker" data-tauri-drag-region>正在播放</span>
          <span class="top-title" data-tauri-drag-region>
            {{ player.currentTrack?.name || "未播放" }}
          </span>
        </div>
        <button
          type="button"
          class="icon-btn no-drag"
          title="桌面歌词"
          @click="toggleDesktopLyric"
        >
          <Icon name="ri:text" :size="18" />
        </button>
      </header>

      <!-- 主舞台 -->
      <div class="stage">
        <aside class="cover-col">
          <div class="cover-frame" :class="{ spin: player.playing && !!coverUrl }">
            <img
              v-if="coverUrl"
              :src="coverUrl"
              alt=""
              class="cover"
              referrerpolicy="no-referrer"
            />
            <div v-else class="cover cover-empty">
              <Icon name="ri:music-2-line" :size="56" />
            </div>
          </div>
          <h2 class="track-name">{{ player.currentTrack?.name || "未播放" }}</h2>
          <p class="track-artist">{{ player.currentTrack ? artist : "选择一首歌开始" }}</p>
        </aside>

        <section class="lyric-col">
          <div
            ref="listRef"
            class="lyric-list"
            @wheel="onUserScroll"
            @pointerdown="onUserScroll"
          >
            <div class="lyric-pad" />
            <template v-if="lines.length">
              <button
                v-for="(line, i) in lines"
                :key="`${line.time}-${i}`"
                type="button"
                class="lyric-line"
                :class="{
                  active: i === activeIndex,
                  near: Math.abs(i - activeIndex) === 1,
                  passed: i < activeIndex,
                }"
                :data-i="i"
                @click="onLineClick(line.time)"
              >
                <span class="lyric-main">{{ line.text || " " }}</span>
                <span v-if="tlyricAt(line.time)" class="lyric-sub">
                  {{ tlyricAt(line.time) }}
                </span>
              </button>
            </template>
            <div v-else class="lyric-empty">
              {{ player.currentTrack ? "这首歌暂无歌词" : "播放歌曲后显示歌词" }}
            </div>
            <div class="lyric-pad" />
          </div>
        </section>
      </div>

      <!-- 内嵌播放控制（属于沉浸页，不显示主窗底栏） -->
      <footer class="dock">
        <div class="progress-row">
          <span class="time">{{ formatTime(player.currentTime) }}</span>
          <NSlider
            class="seek"
            :value="player.currentTime"
            :min="0"
            :max="player.duration || 1"
            :step="0.1"
            :tooltip="false"
            @update:value="onSeek"
          />
          <span class="time">{{ formatTime(player.duration) }}</span>
        </div>

        <div class="dock-controls">
          <div class="dock-left">
            <button
              type="button"
              class="ctl"
              :title="modeTip"
              @click="player.cycleMode()"
            >
              <Icon :name="modeIcon" :size="18" />
            </button>
          </div>

          <div class="dock-center">
            <button type="button" class="ctl" title="上一首" @click="player.prev()">
              <Icon name="ri:skip-back-fill" :size="22" />
            </button>
            <button
              type="button"
              class="ctl-play"
              :disabled="!player.currentTrack"
              title="播放 / 暂停"
              @click="player.toggle()"
            >
              <Icon
                :name="player.playing ? 'ri:pause-fill' : 'ri:play-fill'"
                :size="28"
              />
            </button>
            <button type="button" class="ctl" title="下一首" @click="player.next()">
              <Icon name="ri:skip-forward-fill" :size="22" />
            </button>
          </div>

          <div class="dock-right">
            <Icon
              :name="
                settings.volume === 0 ? 'ri:volume-mute-line' : 'ri:volume-up-line'
              "
              :size="16"
              class="vol-ico"
            />
            <NSlider
              class="vol"
              :value="settings.volume"
              :min="0"
              :max="1"
              :step="0.01"
              :tooltip="false"
              @update:value="onVolume"
            />
          </div>
        </div>
      </footer>
    </div>
  </Transition>
</template>

<style scoped>
.immersive {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  color: #fff;
  overflow: hidden;
}

.bg {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.bg-img {
  position: absolute;
  inset: -60px;
  background-size: cover;
  background-position: center;
  filter: blur(56px) saturate(1.25) brightness(0.75);
  transform: scale(1.15);
  opacity: 0.7;
}

.bg-fallback {
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, #14141c 0%, #0a0a0e 45%, #121018 100%);
}

.bg-veil {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse 80% 70% at 25% 35%,
      rgba(255, 255, 255, 0.06),
      transparent 55%
    ),
    linear-gradient(
      180deg,
      rgba(6, 6, 10, 0.35) 0%,
      rgba(6, 6, 10, 0.55) 55%,
      rgba(6, 6, 10, 0.88) 100%
    );
}

.bg-vignette {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 120px rgba(0, 0, 0, 0.45);
  pointer-events: none;
}

.top-bar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: 48px 1fr 48px;
  align-items: center;
  height: 56px;
  padding: 8px 16px 0;
  flex-shrink: 0;
  user-select: none;
}

.no-drag {
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  -webkit-app-region: no-drag;
  app-region: no-drag;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.16);
}

.top-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 0;
  padding: 0 12px;
}

.top-kicker {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
}

.top-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stage {
  position: relative;
  z-index: 2;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 0.9fr) 1.2fr;
  gap: 32px;
  align-items: center;
  padding: 12px 48px 8px;
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.cover-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 0;
}

.cover-frame {
  width: min(100%, 340px);
  aspect-ratio: 1;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 28px 80px rgba(0, 0, 0, 0.55),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
}

.cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.3);
}

.track-name {
  margin: 24px 0 0;
  max-width: 340px;
  width: 100%;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #fff;
}

.track-artist {
  margin: 8px 0 0;
  max-width: 340px;
  width: 100%;
  text-align: center;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.55);
}

.lyric-col {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000 10%,
    #000 86%,
    transparent 100%
  );
}

.lyric-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0 8px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.18) transparent;
}

.lyric-pad {
  height: 26vh;
  pointer-events: none;
}

.lyric-line {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 14px 12px;
  border-radius: 12px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.26);
  transition:
    color 0.28s ease,
    transform 0.28s ease,
    background 0.2s ease;
}

.lyric-line:hover {
  color: rgba(255, 255, 255, 0.55);
  background: rgba(255, 255, 255, 0.05);
}

.lyric-line.passed {
  color: rgba(255, 255, 255, 0.3);
}

.lyric-line.near {
  color: rgba(255, 255, 255, 0.48);
}

.lyric-line.active {
  color: #ffffff;
  transform: scale(1.03);
  transform-origin: left center;
}

.lyric-main {
  font-size: 24px;
  font-weight: 600;
  line-height: 1.45;
  letter-spacing: 0.01em;
}

.lyric-line.active .lyric-main {
  font-size: 32px;
  font-weight: 700;
  text-shadow: 0 4px 28px rgba(0, 0, 0, 0.4);
}

.lyric-sub {
  font-size: 13px;
  opacity: 0.6;
  line-height: 1.4;
}

.lyric-line.active .lyric-sub {
  font-size: 14px;
  opacity: 0.72;
}

.lyric-empty {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.4);
}

/* 底部内嵌播放坞 */
.dock {
  position: relative;
  z-index: 2;
  flex-shrink: 0;
  padding: 10px 40px 22px;
  max-width: 920px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.time {
  width: 40px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  flex-shrink: 0;
}

.seek {
  flex: 1;
}

.seek :deep(.n-slider-rail) {
  height: 4px !important;
  background: rgba(255, 255, 255, 0.16) !important;
}

.seek :deep(.n-slider-rail__fill) {
  background: #fff !important;
}

.seek :deep(.n-slider-handle) {
  width: 12px !important;
  height: 12px !important;
  border: none !important;
  background: #fff !important;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.35) !important;
}

.dock-controls {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 12px;
}

.dock-left {
  display: flex;
  justify-content: flex-start;
}

.dock-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dock-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.ctl {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}

.ctl:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.ctl-play {
  width: 52px;
  height: 52px;
  border: none;
  border-radius: 50%;
  background: #fff;
  color: #111;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.12s, opacity 0.12s;
}

.ctl-play:hover:not(:disabled) {
  transform: scale(1.06);
}

.ctl-play:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.vol-ico {
  color: rgba(255, 255, 255, 0.55);
  flex-shrink: 0;
}

.vol {
  width: 100px;
  max-width: 22vw;
}

.vol :deep(.n-slider-rail) {
  height: 4px !important;
  background: rgba(255, 255, 255, 0.16) !important;
}

.vol :deep(.n-slider-rail__fill) {
  background: rgba(255, 255, 255, 0.85) !important;
}

.vol :deep(.n-slider-handle) {
  width: 10px !important;
  height: 10px !important;
  border: none !important;
  background: #fff !important;
}

.lyric-fade-enter-active,
.lyric-fade-leave-active {
  transition:
    opacity 0.32s ease,
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.lyric-fade-enter-from,
.lyric-fade-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

@media (max-width: 900px) {
  .stage {
    grid-template-columns: 1fr;
    padding: 4px 20px 0;
    gap: 10px;
    align-content: start;
  }
  .cover-col {
    flex-direction: row;
    gap: 14px;
    justify-content: flex-start;
  }
  .cover-frame {
    width: 88px;
    border-radius: 10px;
  }
  .track-name {
    margin: 0;
    text-align: left;
    font-size: 18px;
  }
  .track-artist {
    margin: 4px 0 0;
    text-align: left;
    font-size: 12px;
  }
  .lyric-main {
    font-size: 18px;
  }
  .lyric-line.active .lyric-main {
    font-size: 22px;
  }
  .dock {
    padding: 8px 16px 18px;
  }
  .dock-right .vol {
    width: 72px;
  }
}
</style>
