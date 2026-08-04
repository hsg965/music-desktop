<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NEmpty,
  NInput,
  NSelect,
  NSpin,
  NTag,
  useMessage,
} from "naive-ui";
import { MUSIC_SOURCES, searchTracks } from "../api/music";
import type { Track } from "../types/music";
import { useSettingsStore } from "../stores/settings";
import { usePlayerStore } from "../stores/player";
import TrackList from "./TrackList.vue";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";
import {
  clearSearchHistory,
  loadSearchHistory,
  pushSearchHistory,
  removeSearchHistoryItem,
} from "../utils/searchHistory";

const router = useRouter();
const settings = useSettingsStore();
const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const keyword = ref("");
const loading = ref(false);
const loadingMore = ref(false);
const playingAll = ref(false);
const results = ref<Track[]>([]);
const page = ref(1);
const pageSize = 20;
const loadError = ref(false);
const history = ref<string[]>([]);
const inputFocused = ref(false);
/** 是否已发起过至少一次搜索（用于空态文案） */
const hasSearched = ref(false);

/** 防止滚动连发多次 loadMore */
let loadSeq = 0;

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));

const placeholder = "输入歌曲名 / 歌手 / 关键词";

const emptyDesc = computed(() => {
  if (!hasSearched.value) {
    if (history.value.length) return "输入关键词搜索，或点击历史记录";
    return "输入歌曲名 / 歌手 / 关键词搜索";
  }
  return "没有找到相关歌曲";
});

const activeTrackKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

onMounted(() => {
  history.value = loadSearchHistory();
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

async function fetchPage(name: string, pages: number, force = false) {
  return searchTracks({
    name,
    source: settings.source,
    count: pageSize,
    pages,
    force,
  });
}

async function doSearch() {
  const name = keyword.value.trim();
  if (!name) {
    message.warning("请输入搜索关键词");
    return;
  }

  const seq = ++loadSeq;
  page.value = 1;
  loading.value = true;
  loadingMore.value = false;
  loadError.value = false;
  inputFocused.value = false;
  hasSearched.value = true;

  try {
    // 主动点搜索：强制走接口，避免空结果/陈旧缓存
    const list = await fetchPage(name, 1, true);
    if (seq !== loadSeq) return;

    results.value = list;
    loadError.value = false;
    history.value = pushSearchHistory(name, history.value);
    if (!list.length) {
      message.info("没有找到相关歌曲");
    }
  } catch (e) {
    if (seq !== loadSeq) return;
    message.error(e instanceof Error ? e.message : "搜索失败");
    results.value = [];
    loadError.value = true;
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

/**
 * 滚动/点击加载下一页。永不「没有更多」：
 * - 有数据：追加并推进页码
 * - 空/失败：不推进页码，标记 loadError，可点击或再滚重试
 */
async function loadMore() {
  if (loading.value || loadingMore.value) return;
  const name = keyword.value.trim();
  if (!name || !hasSearched.value) return;

  const seq = loadSeq;
  const nextPage = page.value + 1;
  loadingMore.value = true;
  loadError.value = false;
  try {
    const list = await fetchPage(name, nextPage, true);
    if (seq !== loadSeq) return;

    if (!list.length) {
      // 限流/空页：不推进页码，保持可重试
      loadError.value = true;
      return;
    }

    const before = results.value.length;
    results.value = mergeUnique(results.value, list);
    const added = results.value.length - before;
    page.value = nextPage;
    // 全重复也推进页码，继续允许往后翻
    if (added === 0) loadError.value = true;
  } catch (e) {
    if (seq !== loadSeq) return;
    loadError.value = true;
    message.error(e instanceof Error ? e.message : "加载更多失败");
  } finally {
    if (seq === loadSeq) loadingMore.value = false;
  }
}

function searchFromHistory(item: string) {
  keyword.value = item;
  void doSearch();
}

function removeHistory(item: string) {
  history.value = removeSearchHistoryItem(item, history.value);
}

function clearHistory() {
  history.value = clearSearchHistory();
}

function onInputFocus() {
  inputFocused.value = true;
}

function onInputBlur() {
  window.setTimeout(() => {
    inputFocused.value = false;
  }, 200);
}

async function onPlay(track: Track) {
  // 单曲播放：只播当前歌曲，不自动把整个结果列表加入队列；
  // 整批播放 / 加入队列请用「播放已加载 / 加入队列」按钮
  await player.playTrack(track);
  if (player.error) message.error(player.error);
}

function onAdd(track: Track) {
  player.addToQueue(track);
  message.success("已加入队列");
}

async function playAllResults() {
  if (!results.value.length) return;
  playingAll.value = true;
  try {
    await player.playAll(results.value, 0);
    if (player.error) message.error(player.error);
    else message.success(`已开始播放，共 ${results.value.length} 首`);
  } finally {
    playingAll.value = false;
  }
}

function addAllToQueue() {
  if (!results.value.length) return;
  const before = player.queue.length;
  player.addManyToQueue(results.value);
  const added = player.queue.length - before;
  message.success(added > 0 ? `已加入 ${added} 首到队列` : "歌曲已在队列中");
}

/** 从曲目列表点专辑名进入专辑页（AlbumPanel 内再按专辑名拉曲目） */
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
      source: String(track.source || settings.source || "netease"),
    },
  });
}
</script>

<template>
  <div class="page-root">
    <header class="page-header">
      <div>
        <h1 class="page-title">搜索</h1>
        <p class="page-subtitle">
          搜索歌曲；结果中点击专辑名可进入专辑页
        </p>
      </div>
    </header>

    <div class="page-toolbar">
      <NSelect
        v-model:value="settings.source"
        :options="sourceOptions"
        class="w-32!"
        size="medium"
      />
      <NInput
        v-model:value="keyword"
        :placeholder="placeholder"
        clearable
        class="flex-1 min-w-40"
        @keydown.enter="doSearch()"
        @focus="onInputFocus"
        @blur="onInputBlur"
      >
        <template #prefix>
          <Icon name="ri:search-line" :size="16" color="var(--text-muted)" />
        </template>
      </NInput>
      <NButton type="primary" :loading="loading" @click="doSearch()">
        搜索
      </NButton>
    </div>

    <div
      v-if="history.length && (inputFocused || !results.length)"
      class="page-toolbar history-row"
    >
      <span class="hist-label">历史</span>
      <NTag
        v-for="item in history"
        :key="item"
        size="small"
        round
        closable
        class="cursor-pointer!"
        @click="searchFromHistory(item)"
        @close="removeHistory(item)"
      >
        {{ item }}
      </NTag>
      <NButton text size="tiny" @click="clearHistory">清空</NButton>
    </div>

    <div v-if="results.length" class="page-toolbar">
      <NButton type="primary" size="small" :loading="playingAll" @click="playAllResults">
        <template #icon>
          <Icon name="ri:play-fill" :size="14" />
        </template>
        播放已加载
      </NButton>
      <NButton size="small" @click="addAllToQueue">
        <template #icon>
          <Icon name="ri:play-list-add-line" :size="14" />
        </template>
        加入队列
      </NButton>
      <span class="meta-count">已加载 {{ results.length }} 首</span>
    </div>

    <div class="page-body list-body">
      <NSpin :show="loading" class="spin-fill">
        <TrackList
          v-if="results.length"
          :tracks="results"
          :virtual="results.length > 40"
          :active-key="activeTrackKey"
          album-link
          infinite
          :loading-more="loadingMore"
          :load-error="loadError"
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
          @open-album="openAlbum"
          @load-more="loadMore"
        />

        <div v-else class="empty-box">
          <NEmpty :description="emptyDesc" />
        </div>
      </NSpin>
    </div>
  </div>
</template>

<style scoped>
.history-row {
  gap: 6px;
}
.hist-label {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
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
  align-items: center;
  justify-content: center;
}
</style>
