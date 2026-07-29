<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import {
  NButton,
  NEmpty,
  NInput,
  NSelect,
  NSpin,
  NPagination,
  NTag,
  NRadioGroup,
  NRadioButton,
  useMessage,
} from "naive-ui";
import { MUSIC_SOURCES, SEARCH_KINDS, searchTracks } from "../api/music";
import type { SearchKind, Track } from "../types/music";
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
/** 搜索类别：单曲 / 歌手 / 专辑 */
const searchKind = ref<SearchKind>("song");

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));

const kindMeta = computed(
  () => SEARCH_KINDS.find((k) => k.value === searchKind.value) ?? SEARCH_KINDS[0],
);

const placeholder = computed(() => {
  if (searchKind.value === "artist") return "输入歌手名，如：周杰伦";
  if (searchKind.value === "album") return "输入专辑名或关键词";
  return "输入歌曲名 / 关键词";
});

const emptyDesc = computed(() => {
  if (history.value.length) return "输入关键词搜索，或点击历史记录";
  return kindMeta.value.hint;
});

const resultUnit = computed(() =>
  searchKind.value === "album" ? "首（专辑曲目）" : "首",
);

onMounted(() => {
  history.value = loadSearchHistory();
});

// 切换类别后，若已有关键词则自动重搜
watch(searchKind, () => {
  if (keyword.value.trim() && (results.value.length || page.value > 1)) {
    doSearch(true, false);
  } else {
    results.value = [];
    page.value = 1;
    hasMore.value = false;
  }
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
      kind: searchKind.value,
      count: pageSize,
      pages: page.value,
    });
    results.value = list;
    hasMore.value = list.length >= pageSize;
    if (resetPage || fromHistory) {
      history.value = pushSearchHistory(name, history.value);
    }
    if (!list.length) {
      message.info(
        searchKind.value === "album"
          ? "未找到相关专辑曲目，可换关键词或音源试试"
          : "没有找到相关结果",
      );
    }
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
    <!-- 搜索类别：单曲 / 歌手 / 专辑 -->
    <div class="flex flex-wrap items-center gap-2">
      <NRadioGroup v-model:value="searchKind" size="small" name="search-kind">
        <NRadioButton
          v-for="k in SEARCH_KINDS"
          :key="k.value"
          :value="k.value"
          :label="k.label"
        />
      </NRadioGroup>
      <span class="text-xs" style="color: var(--text-faint)">
        {{ kindMeta.hint }}
      </span>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <NSelect
        v-model:value="settings.source"
        :options="sourceOptions"
        class="w-36!"
        size="medium"
      />
      <NInput
        v-model:value="keyword"
        :placeholder="placeholder"
        clearable
        class="flex-1 min-w-48"
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

    <!-- 搜索历史 -->
    <div
      v-if="history.length && (inputFocused || !results.length)"
      class="flex flex-wrap items-center gap-2 px-0.5"
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
      class="flex flex-wrap items-center gap-2 px-0.5"
    >
      <NTag size="small" round :bordered="false" style="background: var(--primary-soft)">
        {{ kindMeta.label }}
      </NTag>
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
        共 {{ results.length }} {{ resultUnit }}
      </span>
    </div>

    <div class="flex-1 min-h-0 overflow-auto skin-panel">
      <NSpin :show="loading" class="h-full min-h-60">
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
