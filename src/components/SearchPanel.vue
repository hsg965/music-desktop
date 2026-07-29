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
  <div class="search-root h-full min-h-0 flex flex-col gap-3 p-4">
    <div class="flex flex-wrap items-center gap-2 shrink-0">
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
          <Icon name="ri:search-line" :size="16" color="var(--primary)" />
        </template>
      </NInput>
      <NButton type="primary" strong secondary :loading="loading" @click="doSearch()">
        搜索
      </NButton>
    </div>

    <div
      v-if="history.length && (inputFocused || !results.length)"
      class="flex flex-wrap items-center gap-2 px-0.5 shrink-0"
    >
      <span class="text-xs shrink-0" style="color: var(--text-muted)">历史</span>
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
      <NButton text size="tiny" style="color: var(--text-muted)" @click="clearHistory">
        清空
      </NButton>
    </div>

    <div
      v-if="results.length"
      class="flex flex-wrap items-center gap-2 px-0.5 shrink-0"
    >
      <NButton
        type="primary"
        strong
        secondary
        size="small"
        :loading="playingAll"
        @click="playAllResults"
      >
        <template #icon>
          <Icon name="ri:play-list-fill" :size="14" />
        </template>
        一键播放
      </NButton>
      <NButton size="small" secondary @click="addAllToQueue">
        <template #icon>
          <Icon name="ri:play-list-add-line" :size="14" />
        </template>
        全部加入队列
      </NButton>
      <span class="text-xs" style="color: var(--text-muted)">
        本页 {{ results.length }} 首
      </span>
    </div>

    <div class="list-shell flex-1 min-h-0 skin-panel flex flex-col">
      <div class="list-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <NSpin :show="loading" class="min-h-60 w-full">
          <TrackList
            v-if="results.length"
            :tracks="results"
            @play="onPlay"
            @add="onAdd"
            @download="openDownload"
          />
          <div v-else class="h-60 flex items-center justify-center">
            <NEmpty :description="emptyDesc" />
          </div>
        </NSpin>
      </div>
    </div>

    <div
      v-if="itemCount > 0 && results.length"
      class="flex justify-end shrink-0 pt-1"
    >
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
.search-root {
  box-sizing: border-box;
}

.list-shell {
  min-height: 0;
}

.list-scroll {
  overscroll-behavior: contain;
}
</style>
