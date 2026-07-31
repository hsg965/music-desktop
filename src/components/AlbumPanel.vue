<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NEmpty,
  NSpin,
  useMessage,
} from "naive-ui";
import { fetchPicUrl, searchAlbumTracks } from "../api/music";
import type { Track } from "../types/music";
import { usePlayerStore } from "../stores/player";
import TrackList from "./TrackList.vue";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";

const route = useRoute();
const router = useRouter();
const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const loading = ref(false);
const loadingMore = ref(false);
const playingAll = ref(false);
const tracks = ref<Track[]>([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);
const coverUrl = ref("");
const errorText = ref("");

let loadSeq = 0;
let loadMoreCooldownUntil = 0;

const albumName = computed(() => String(route.query.name || "").trim());
const source = computed(() => String(route.query.source || "netease").trim() || "netease");

const artistSummary = computed(() => {
  const counts = new Map<string, number>();
  for (const t of tracks.value) {
    for (const a of t.artist || []) {
      const name = String(a).trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
  }
  if (!counts.size) return "未知歌手";
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
});

const activeTrackKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

function trackKey(t: Track) {
  return `${t.source}-${t.id}`;
}

function mergeUnique(base: Track[], extra: Track[]) {
  const seen = new Set(base.map(trackKey));
  const out = [...base];
  for (const t of extra) {
    const k = trackKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

async function resolveCover(list: Track[]) {
  const first = list.find((t) => t.picUrl) || list[0];
  if (first?.picUrl) {
    coverUrl.value = first.picUrl;
  } else if (first?.pic_id != null && first.pic_id !== "") {
    coverUrl.value = await fetchPicUrl(first.pic_id, first.source || source.value, 500);
  } else {
    coverUrl.value = "";
  }
}

async function loadAlbum(reset: boolean) {
  const name = albumName.value;
  if (!name) {
    tracks.value = [];
    errorText.value = "缺少专辑名";
    hasMore.value = false;
    coverUrl.value = "";
    return;
  }

  if (reset) {
    const seq = ++loadSeq;
    page.value = 1;
    loading.value = true;
    loadingMore.value = false;
    hasMore.value = false;
    errorText.value = "";
    try {
      const list = await searchAlbumTracks({
        name,
        source: source.value,
        count: pageSize,
        pages: 1,
        force: true,
      });
      if (seq !== loadSeq) return;

      tracks.value = list;
      hasMore.value = list.length >= pageSize;
      loadMoreCooldownUntil = 0;

      if (!list.length) {
        errorText.value = "暂无专辑曲目（可能音源不支持、专辑名无匹配或接口限流）";
        coverUrl.value = "";
        return;
      }

      await resolveCover(list);
    } catch (e) {
      if (seq !== loadSeq) return;
      tracks.value = [];
      hasMore.value = false;
      coverUrl.value = "";
      errorText.value = e instanceof Error ? e.message : "加载专辑失败";
      message.error(errorText.value);
    } finally {
      if (seq === loadSeq) loading.value = false;
    }
    return;
  }

  // load more：空响应不关 hasMore，页码不推进，可再滚重试
  if (loading.value || loadingMore.value || !hasMore.value) return;
  if (Date.now() < loadMoreCooldownUntil) return;
  const seq = loadSeq;
  const nextPage = page.value + 1;
  loadingMore.value = true;
  try {
    const list = await searchAlbumTracks({
      name,
      source: source.value,
      count: pageSize,
      pages: nextPage,
      force: true,
    });
    if (seq !== loadSeq) return;

    if (!list.length) {
      loadMoreCooldownUntil = Date.now() + 2500;
      return;
    }

    const before = tracks.value.length;
    tracks.value = mergeUnique(tracks.value, list);
    const added = tracks.value.length - before;

    if (added === 0) {
      page.value = nextPage;
      loadMoreCooldownUntil = Date.now() + 1500;
      hasMore.value = true;
      return;
    }

    page.value = nextPage;
    hasMore.value = list.length >= pageSize;
  } catch (e) {
    if (seq !== loadSeq) return;
    loadMoreCooldownUntil = Date.now() + 2500;
    message.error(e instanceof Error ? e.message : "加载更多失败");
  } finally {
    if (seq === loadSeq) loadingMore.value = false;
  }
}

watch(
  () => [route.query.name, route.query.source] as const,
  () => {
    void loadAlbum(true);
  },
  { immediate: true },
);

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace({ name: "main" });
  }
}

async function onPlay(track: Track) {
  // 以当前专辑已加载曲目为播放上下文，上下曲继续专辑列表
  const list = tracks.value;
  const idx = list.findIndex(
    (t) => `${t.source}-${t.id}` === `${track.source}-${track.id}`,
  );
  await player.playAll(list, idx >= 0 ? idx : 0);
  if (player.error) message.error(player.error);
}

function onAdd(track: Track) {
  player.addToQueue(track);
  message.success("已加入队列");
}

async function playLoaded() {
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

function addLoadedToQueue() {
  if (!tracks.value.length) return;
  const before = player.queue.length;
  player.addManyToQueue(tracks.value);
  const added = player.queue.length - before;
  message.success(added > 0 ? `已加入 ${added} 首到队列` : "歌曲已在队列中");
}
</script>

<template>
  <div class="page-root">
    <header class="page-header album-header">
      <button type="button" class="back-btn" title="返回" @click="goBack">
        <Icon name="ri:arrow-left-line" :size="18" />
        <span>返回</span>
      </button>
    </header>

    <div class="album-hero">
      <div class="cover">
        <img
          v-if="coverUrl"
          :src="coverUrl"
          alt=""
          referrerpolicy="no-referrer"
        />
        <Icon
          v-else
          name="ri:album-line"
          :size="36"
          color="var(--text-faint)"
        />
      </div>
      <div class="hero-meta min-w-0">
        <div class="hero-label">专辑</div>
        <h1 class="page-title truncate" :title="albumName || '未知专辑'">
          {{ albumName || "未知专辑" }}
        </h1>
        <p class="page-subtitle truncate">
          {{ artistSummary }}
          <span v-if="source" class="src-tag"> · {{ source }}</span>
        </p>
        <div class="hero-actions">
          <NButton
            type="primary"
            size="small"
            :loading="playingAll"
            :disabled="!tracks.length"
            @click="playLoaded"
          >
            <template #icon>
              <Icon name="ri:play-fill" :size="14" />
            </template>
            播放已加载
          </NButton>
          <NButton size="small" :disabled="!tracks.length" @click="addLoadedToQueue">
            <template #icon>
              <Icon name="ri:play-list-add-line" :size="14" />
            </template>
            加入队列
          </NButton>
          <span v-if="tracks.length" class="meta-count">已加载 {{ tracks.length }} 首</span>
        </div>
      </div>
    </div>

    <div class="page-body list-body">
      <NSpin :show="loading" class="spin-fill">
        <TrackList
          v-if="tracks.length"
          :tracks="tracks"
          :virtual="tracks.length > 40"
          :active-key="activeTrackKey"
          :album-link="false"
          infinite
          :has-more="hasMore"
          :loading-more="loadingMore"
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
          @load-more="loadAlbum(false)"
        />
        <div v-else class="empty-box">
          <NEmpty :description="errorText || '暂无曲目'" />
          <NButton
            v-if="albumName"
            size="small"
            class="mt-3"
            :loading="loading"
            @click="loadAlbum(true)"
          >
            重试
          </NButton>
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.album-header {
  padding-bottom: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 0;
  border-radius: var(--radius-sm);
}

.back-btn:hover {
  color: var(--text);
}

.album-hero {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  padding: 8px 0 12px;
  flex-shrink: 0;
}

.cover {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md, 8px);
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 2px;
}

.hero-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.src-tag {
  color: var(--text-faint);
  font-size: 12px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.meta-count {
  font-size: 12px;
  color: var(--text-faint);
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
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.mt-3 {
  margin-top: 12px;
}

@media (max-width: 640px) {
  .cover {
    width: 88px;
    height: 88px;
  }
}
</style>
