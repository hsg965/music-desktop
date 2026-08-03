<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { NButton, NEmpty, NSpin, useMessage } from "naive-ui";
import { CHART_LIST, fetchPlaylist } from "../api/music";
import type { PlaylistDetail, Track } from "../types/music";
import { usePlayerStore } from "../stores/player";
import TrackList from "./TrackList.vue";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";

const router = useRouter();
const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const charts = CHART_LIST;
const activeId = ref(charts[0]?.id ?? "19723756");
const loading = ref(false);
const playingAll = ref(false);
const detail = ref<PlaylistDetail | null>(null);
const cache = new Map<string, PlaylistDetail>();

const activeChart = computed(
  () => charts.find((c) => c.id === activeId.value) ?? charts[0],
);

const tracks = computed(() => detail.value?.tracks ?? []);

const activeTrackKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

function formatPlayCount(n: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)} 亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)} 万`;
  return String(n);
}

function formatUpdateTime(ts: number): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

/** 请求序号：快速连点时丢弃过期响应 */
let loadSeq = 0;

async function loadChart(id: string, force = false) {
  const seq = ++loadSeq;

  if (!force && cache.has(id)) {
    // 先切 UI，下一帧再挂大列表，避免与点击同帧卡顿
    loading.value = false;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (seq !== loadSeq || activeId.value !== id) return;
    detail.value = cache.get(id)!;
    return;
  }

  loading.value = true;
  // 切换时先清空列表，避免 100+ 行与网络同时抢主线程
  if (activeId.value === id) detail.value = null;

  try {
    const data = await fetchPlaylist(id);
    if (seq !== loadSeq || activeId.value !== id) return;
    cache.set(id, data);
    // 分帧提交，让 spinner 先画出来
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
    if (seq !== loadSeq || activeId.value !== id) return;
    detail.value = data;
  } catch (e) {
    if (seq !== loadSeq || activeId.value !== id) return;
    detail.value = null;
    message.error(e instanceof Error ? e.message : "加载热榜失败");
  } finally {
    if (seq === loadSeq && activeId.value === id) loading.value = false;
  }
}

function selectChart(id: string) {
  if (id === activeId.value) return;
  activeId.value = id;
}

async function onPlay(track: Track) {
  // 单曲播放：只播当前歌曲，不自动把整个列表加入队列；
  // 整榜播放 / 加入队列请用「播放全部 / 加入队列」按钮
  await player.playTrack(track);
  if (player.error) message.error(player.error);
}

function onAdd(track: Track) {
  player.addToQueue(track);
  message.success("已加入队列");
}

async function playAll() {
  if (!tracks.value.length) return;
  playingAll.value = true;
  try {
    await player.playAll(tracks.value, 0);
    if (player.error) message.error(player.error);
    else message.success(`已开始播放，共 ${tracks.value.length} 首`);
  } finally {
    playingAll.value = false;
  }
}

function addAllToQueue() {
  if (!tracks.value.length) return;
  const before = player.queue.length;
  player.addManyToQueue(tracks.value);
  const added = player.queue.length - before;
  message.success(added > 0 ? `已加入 ${added} 首到队列` : "歌曲已在队列中");
}

function openAlbum(track: Track) {
  const name = (track.album || "").trim();
  if (!name) {
    message.warning("该曲目没有专辑信息");
    return;
  }
  void router.push({
    name: "album",
    query: {
      name,
      source: String(track.source || "netease"),
    },
  });
}

function refresh() {
  void loadChart(activeId.value, true);
}

watch(activeId, (id) => {
  void loadChart(id);
});

onMounted(() => {
  void loadChart(activeId.value);
});
</script>

<template>
  <div class="page-root charts-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">热榜</h1>
        <p class="page-subtitle">官方榜单 · 每日更新</p>
      </div>
      <button
        type="button"
        class="refresh-btn"
        title="刷新"
        :disabled="loading"
        @click="refresh"
      >
        <Icon
          :name="loading ? 'ri:loader-4-line' : 'ri:refresh-line'"
          :size="16"
          :class="{ spinning: loading }"
        />
      </button>
    </header>

    <div class="chart-tabs page-toolbar">
      <button
        v-for="c in charts"
        :key="c.id"
        type="button"
        class="chart-tab"
        :class="{ active: c.id === activeId }"
        @click="selectChart(c.id)"
      >
        {{ c.name }}
      </button>
    </div>

    <section class="hero" v-if="detail || loading">
      <div class="cover-wrap">
        <img
          v-if="detail?.coverImgUrl"
          :src="detail.coverImgUrl"
          :alt="detail.name"
          class="cover"
          referrerpolicy="no-referrer"
        />
        <div v-else class="cover placeholder">
          <Icon name="ri:bar-chart-grouped-line" :size="28" />
        </div>
      </div>
      <div class="hero-meta">
        <div class="hero-label">官方榜单</div>
        <h2 class="hero-title">
          {{ detail?.name || activeChart?.name || "热榜" }}
        </h2>
        <p v-if="detail?.description" class="hero-desc">
          {{ detail.description }}
        </p>
        <div class="hero-stats">
          <span v-if="detail?.trackCount">{{ detail.trackCount }} 首</span>
          <span v-if="detail?.playCount">播放 {{ formatPlayCount(detail.playCount) }}</span>
          <span v-if="detail?.updateTime">更新 {{ formatUpdateTime(detail.updateTime) }}</span>
        </div>
        <div class="hero-actions">
          <NButton
            type="primary"
            size="small"
            :disabled="!tracks.length"
            :loading="playingAll"
            @click="playAll"
          >
            <template #icon>
              <Icon name="ri:play-fill" :size="14" />
            </template>
            播放全部
          </NButton>
          <NButton size="small" :disabled="!tracks.length" @click="addAllToQueue">
            <template #icon>
              <Icon name="ri:play-list-add-line" :size="14" />
            </template>
            加入队列
          </NButton>
        </div>
      </div>
    </section>

    <div class="page-body list-body">
      <NSpin :show="loading" class="spin-fill">
        <TrackList
          v-if="tracks.length"
          :key="activeId"
          :tracks="tracks"
          :active-key="activeTrackKey"
          album-link
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
          @open-album="openAlbum"
        />
        <div v-else class="empty-box">
          <NEmpty :description="loading ? '加载中…' : '暂无榜单数据'" />
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.refresh-btn {
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
  flex-shrink: 0;
  transition:
    color 0.12s,
    background 0.12s;
}

.refresh-btn:hover:not(:disabled) {
  color: var(--text);
  background: var(--surface-2);
}

.refresh-btn:disabled {
  cursor: default;
  opacity: 0.85;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.chart-tabs {
  gap: 6px;
  overflow-x: auto;
  flex-wrap: nowrap;
  padding-bottom: 2px;
}

.chart-tab {
  appearance: none;
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  padding: 8px 12px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}

.chart-tab:hover {
  color: var(--text);
  background: var(--surface-2);
}

.chart-tab.active {
  color: #fff;
  background: var(--primary);
  font-weight: 600;
}

html[data-mode="light"] .chart-tab.active {
  color: #fff;
}

.hero {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  flex-shrink: 0;
  padding: 4px 0 8px;
}

.cover-wrap {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
}

.cover {
  width: 140px;
  height: 140px;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  background: var(--surface-2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
}

.cover.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
}

.hero-meta {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 2px;
}

.hero-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.hero-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--text);
}

.hero-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 640px;
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--text-faint);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.list-body {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.spin-fill {
  width: 100%;
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.spin-fill :deep(.n-spin-content) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.empty-box {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 720px) {
  .cover-wrap,
  .cover {
    width: 96px;
    height: 96px;
  }
  .hero-title {
    font-size: 22px;
  }
}
</style>
