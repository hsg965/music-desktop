<script setup lang="ts">
import { ref, onMounted } from "vue";
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
const history = ref<string[]>([]);
const inputFocused = ref(false);

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));

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
    // 仅在新搜索时记历史（分页不重复写）
    if (resetPage || fromHistory) {
      history.value = pushSearchHistory(name, history.value);
    }
    if (!list.length) message.info("没有找到相关歌曲");
  } catch (e) {
    message.error(e instanceof Error ? e.message : "搜索失败");
    results.value = [];
  } finally {
    loading.value = false;
  }
}

function searchFromHistory(item: string) {
  keyword.value = item;
  doSearch(true, true);
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
  // 延迟，便于点击历史标签
  window.setTimeout(() => {
    inputFocused.value = false;
  }, 200);
}

function onPageChange(p: number) {
  page.value = p;
  doSearch(false);
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
  <div class="h-full flex flex-col gap-3 p-4">
    <div class="flex flex-wrap items-center gap-2">
      <NSelect
        v-model:value="settings.source"
        :options="sourceOptions"
        class="w-36!"
        size="medium"
      />
      <NInput
        v-model:value="keyword"
        placeholder="搜索歌曲 / 歌手 / 专辑"
        clearable
        class="flex-1 min-w-48"
        @keydown.enter="doSearch()"
        @focus="onInputFocus"
        @blur="onInputBlur"
      >
        <template #prefix>
          <Icon name="ri:search-line" :size="16" color="rgba(255,255,255,0.45)" />
        </template>
      </NInput>
      <NButton type="primary" :loading="loading" @click="doSearch()">
        搜索
      </NButton>
    </div>

    <!-- 搜索历史：最多 10 条 -->
    <div
      v-if="history.length && (inputFocused || !results.length)"
      class="flex flex-wrap items-center gap-2 px-0.5"
    >
      <span class="text-xs text-white/35 shrink-0">历史</span>
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
      <NButton text size="tiny" class="text-white/35!" @click="clearHistory">
        清空
      </NButton>
    </div>

    <div
      v-if="results.length"
      class="flex flex-wrap items-center gap-2 px-0.5"
    >
      <NButton
        type="primary"
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
      <span class="text-xs text-white/35">共 {{ results.length }} 首</span>
    </div>

    <div class="flex-1 min-h-0 overflow-auto rounded-xl bg-white/3 border border-white/5">
      <NSpin :show="loading" class="h-full min-h-60">
        <TrackList
          v-if="results.length"
          :tracks="results"
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
        />
        <div v-else class="h-60 flex items-center justify-center">
          <NEmpty
            :description="
              history.length
                ? '输入关键词搜索，或点击历史记录'
                : '输入关键词搜索在线音乐'
            "
          />
        </div>
      </NSpin>
    </div>

    <div v-if="results.length" class="flex justify-end">
      <NPagination
        v-model:page="page"
        :page-size="pageSize"
        :item-count="hasMore ? page * pageSize + 1 : page * pageSize"
        :page-slot="5"
        size="small"
        @update:page="onPageChange"
      />
    </div>
  </div>
</template>
