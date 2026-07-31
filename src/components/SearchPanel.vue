<script setup lang="ts">
import { computed, ref, onMounted } from "vue";
import {
  NButton,
  NEmpty,
  NInput,
  NSelect,
  NSpin,
  NPagination,
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

const settings = useSettingsStore();
const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const keyword = ref("");
const loading = ref(false);
const playingAll = ref(false);
const results = ref<Track[]>([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);
const itemCount = ref(0);
const history = ref<string[]>([]);
const inputFocused = ref(false);

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));

const emptyDesc = computed(() => {
  if (history.value.length) return "输入关键词搜索，或点击历史记录";
  return "输入歌曲名 / 歌手 / 关键词搜索";
});

onMounted(() => {
  history.value = loadSearchHistory();
});

async function doSearch(resetPage = true, fromHistory = false) {
  const name = keyword.value.trim();
  if (!name) {
    message.warning("请输入搜索关键词");
    return;
  }
  if (resetPage) page.value = 1;

  loading.value = true;
  inputFocused.value = false;
  try {
    const list = await searchTracks({
      name,
      source: settings.source,
      count: pageSize,
      pages: page.value,
    });
    results.value = list;
    hasMore.value = list.length >= pageSize;
    if (!hasMore.value) {
      itemCount.value = (page.value - 1) * pageSize + list.length;
    } else {
      itemCount.value = page.value * pageSize + 1;
    }

    if (resetPage || fromHistory) {
      history.value = pushSearchHistory(name, history.value);
    }
    if (!list.length) {
      message.info("没有找到相关结果");
    }
  } catch (e) {
    message.error(e instanceof Error ? e.message : "搜索失败");
    results.value = [];
    itemCount.value = 0;
    hasMore.value = false;
  } finally {
    loading.value = false;
  }
}

function searchFromHistory(item: string) {
  keyword.value = item;
  void doSearch(true, true);
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

function onPageChange(p: number) {
  if (p === page.value) return;
  page.value = p;
  void doSearch(false);
}

async function onPlay(track: Track) {
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
</script>

<template>
  <div class="page-root">
    <header class="page-header">
      <div>
        <h1 class="page-title">搜索</h1>
        <p class="page-subtitle">按歌曲、歌手或关键词查找</p>
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
        placeholder="输入歌曲名 / 歌手 / 关键词"
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
        播放本页
      </NButton>
      <NButton size="small" @click="addAllToQueue">
        <template #icon>
          <Icon name="ri:play-list-add-line" :size="14" />
        </template>
        加入队列
      </NButton>
      <span class="meta-count">本页 {{ results.length }} 首</span>
    </div>

    <div class="page-body list-body">
      <NSpin :show="loading" class="spin-fill">
        <TrackList
          v-if="results.length"
          :tracks="results"
          :virtual="false"
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
        />
        <div v-else class="empty-box">
          <NEmpty :description="emptyDesc" />
        </div>
      </NSpin>
    </div>

    <div v-if="itemCount > 0 && results.length" class="pager">
      <NPagination
        :page="page"
        :page-size="pageSize"
        :item-count="itemCount"
        :page-slot="5"
        size="small"
        @update:page="onPageChange"
      />
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
.pager {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}
</style>
