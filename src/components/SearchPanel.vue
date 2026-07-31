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
import { MUSIC_SOURCES, searchAlbumTracks, searchTracks } from "../api/music";
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

type SearchTab = "song" | "album";

interface AlbumHit {
  key: string;
  name: string;
  source: string;
  artist: string;
  picUrl?: string;
  pic_id?: string | number;
  /** 当前已加载结果中出现的曲目数（非全专曲数） */
  hitCount: number;
}

const router = useRouter();
const settings = useSettingsStore();
const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const keyword = ref("");
const tab = ref<SearchTab>("song");
const loading = ref(false);
const loadingMore = ref(false);
const playingAll = ref(false);
/** 歌曲 Tab 结果；专辑 Tab 也先缓存原始曲目用于分组与播放 */
const results = ref<Track[]>([]);
const page = ref(1);
const pageSize = 20;
const hasMore = ref(false);
const history = ref<string[]>([]);
const inputFocused = ref(false);
/** 是否已发起过至少一次搜索（用于空态文案） */
const hasSearched = ref(false);

/** 防止滚动连发多次 loadMore */
let loadSeq = 0;
/** 空响应后的冷却，避免贴底死循环打接口 */
let loadMoreCooldownUntil = 0;

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));

const placeholder = computed(() =>
  tab.value === "album"
    ? "输入专辑名搜索"
    : "输入歌曲名 / 歌手 / 关键词",
);

const emptyDesc = computed(() => {
  if (!hasSearched.value) {
    if (history.value.length) return "输入关键词搜索，或点击历史记录";
    return tab.value === "album"
      ? "切换到专辑后输入专辑名搜索"
      : "输入歌曲名 / 歌手 / 关键词搜索";
  }
  return tab.value === "album" ? "没有找到相关专辑" : "没有找到相关歌曲";
});

const activeTrackKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

/** 专辑 Tab：按专辑名聚合（接口无 album 实体，只能从曲目反推） */
const albumHits = computed((): AlbumHit[] => {
  if (tab.value !== "album") return [];
  const map = new Map<string, AlbumHit>();
  for (const t of results.value) {
    const name = (t.album || "").trim() || "未知专辑";
    const source = String(t.source || settings.source || "netease");
    const key = `${source}::${name}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        key,
        name,
        source,
        artist: (t.artist || []).join(" / ") || "未知歌手",
        picUrl: t.picUrl,
        pic_id: t.pic_id,
        hitCount: 1,
      });
    } else {
      existing.hitCount += 1;
      if (!existing.picUrl && t.picUrl) existing.picUrl = t.picUrl;
      if ((existing.pic_id == null || existing.pic_id === "") && t.pic_id != null) {
        existing.pic_id = t.pic_id;
      }
    }
  }
  return [...map.values()];
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
  if (tab.value === "album") {
    return searchAlbumTracks({
      name,
      source: settings.source,
      count: pageSize,
      pages,
      force,
    });
  }
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
  inputFocused.value = false;
  hasMore.value = false;
  hasSearched.value = true;

  try {
    // 主动点搜索：强制走接口，避免空结果/陈旧缓存
    const list = await fetchPage(name, 1, true);
    if (seq !== loadSeq) return;

    results.value = list;
    // 首屏：满页才认为可能还有下一页；空首屏不开启滚动加载
    hasMore.value = list.length >= pageSize;
    loadMoreCooldownUntil = 0;
    history.value = pushSearchHistory(name, history.value);
    if (!list.length) {
      message.info(tab.value === "album" ? "没有找到相关专辑" : "没有找到相关歌曲");
    }
  } catch (e) {
    if (seq !== loadSeq) return;
    message.error(e instanceof Error ? e.message : "搜索失败");
    results.value = [];
    hasMore.value = false;
  } finally {
    if (seq === loadSeq) loading.value = false;
  }
}

/**
 * 滚动加载下一页。
 * - 满页：追加并 hasMore=true
 * - 半页（有数据但不足 pageSize）：追加并 hasMore=false（真到底）
 * - 空数组：多半是限流/抖动，不推进页码、保持 hasMore，冷却后可再滚触发
 */
async function loadMore() {
  if (loading.value || loadingMore.value || !hasMore.value) return;
  if (Date.now() < loadMoreCooldownUntil) return;
  const name = keyword.value.trim();
  if (!name) return;

  const seq = loadSeq;
  const nextPage = page.value + 1;
  loadingMore.value = true;
  try {
    // 强制请求，避免空页被缓存；限流空数据时必须能重试
    const list = await fetchPage(name, nextPage, true);
    if (seq !== loadSeq) return;

    if (!list.length) {
      // 不推进 page，保持可继续加载
      loadMoreCooldownUntil = Date.now() + 2500;
      return;
    }

    const before = results.value.length;
    results.value = mergeUnique(results.value, list);
    const added = results.value.length - before;

    if (added === 0) {
      // 全是重复：可能页码异常，推进一页后继续允许加载
      page.value = nextPage;
      loadMoreCooldownUntil = Date.now() + 1500;
      hasMore.value = true;
      return;
    }

    page.value = nextPage;
    // 只有不足一页才认为没有更多（真·末页）
    hasMore.value = list.length >= pageSize;
  } catch (e) {
    if (seq !== loadSeq) return;
    // 失败同样保持 hasMore，允许再滚重试
    loadMoreCooldownUntil = Date.now() + 2500;
    message.error(e instanceof Error ? e.message : "加载更多失败");
  } finally {
    if (seq === loadSeq) loadingMore.value = false;
  }
}

function switchTab(next: SearchTab) {
  if (tab.value === next) return;
  tab.value = next;
  results.value = [];
  page.value = 1;
  hasMore.value = false;
  hasSearched.value = false;
  // 有关键词则按新类型自动重搜
  if (keyword.value.trim()) {
    void doSearch();
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
  const list = results.value;
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

function openAlbumHit(hit: AlbumHit) {
  if (!hit.name || hit.name === "未知专辑") {
    message.warning("该专辑信息无效");
    return;
  }
  void router.push({
    name: "album",
    query: {
      name: hit.name,
      source: hit.source || settings.source || "netease",
    },
  });
}

function onAlbumListScroll(e: Event) {
  const el = e.target as HTMLElement;
  if (!el || loadingMore.value || !hasMore.value) return;
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (remain <= 120) void loadMore();
}
</script>

<template>
  <div class="page-root">
    <header class="page-header">
      <div>
        <h1 class="page-title">搜索</h1>
        <p class="page-subtitle">
          歌曲与专辑分栏搜索；专辑名请切到「专辑」Tab
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

    <!-- 歌曲 / 专辑 -->
    <div class="tab-row">
      <button
        type="button"
        class="tab-btn"
        :class="{ active: tab === 'song' }"
        @click="switchTab('song')"
      >
        歌曲
      </button>
      <button
        type="button"
        class="tab-btn"
        :class="{ active: tab === 'album' }"
        @click="switchTab('album')"
      >
        专辑
      </button>
    </div>

    <div v-if="tab === 'song' && results.length" class="page-toolbar">
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

    <div v-else-if="tab === 'album' && albumHits.length" class="page-toolbar">
      <span class="meta-count">已匹配 {{ albumHits.length }} 张专辑</span>
    </div>

    <div class="page-body list-body">
      <NSpin :show="loading" class="spin-fill">
        <!-- 歌曲列表 -->
        <TrackList
          v-if="tab === 'song' && results.length"
          :tracks="results"
          :virtual="results.length > 40"
          :active-key="activeTrackKey"
          album-link
          infinite
          :has-more="hasMore"
          :loading-more="loadingMore"
          @play="onPlay"
          @add="onAdd"
          @download="openDownload"
          @open-album="openAlbum"
          @load-more="loadMore"
        />

        <!-- 专辑卡片列表 -->
        <div
          v-else-if="tab === 'album' && albumHits.length"
          class="album-scroller"
          @scroll.passive="onAlbumListScroll"
        >
          <button
            v-for="hit in albumHits"
            :key="hit.key"
            type="button"
            class="album-card"
            @click="openAlbumHit(hit)"
          >
            <div class="album-cover">
              <img
                v-if="hit.picUrl"
                :src="hit.picUrl"
                alt=""
                loading="lazy"
                referrerpolicy="no-referrer"
              />
              <Icon
                v-else
                name="ri:album-line"
                :size="28"
                color="var(--text-faint)"
              />
            </div>
            <div class="album-meta min-w-0">
              <div class="album-name truncate">{{ hit.name }}</div>
              <div class="album-artist truncate">{{ hit.artist }}</div>
              <div class="album-extra">
                点击查看曲目
                <span v-if="hit.hitCount > 1"> · 本页相关 {{ hit.hitCount }} 首</span>
              </div>
            </div>
            <Icon
              name="ri:arrow-right-s-line"
              :size="20"
              color="var(--text-faint)"
              class="album-chevron"
            />
          </button>
          <div class="list-footer">
            <span v-if="loadingMore">加载中…</span>
            <span v-else-if="hasMore">滚动加载更多（无数据时可再滚一次重试）</span>
            <span v-else>没有更多了</span>
          </div>
        </div>

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

.tab-row {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  padding-bottom: 2px;
}

.tab-btn {
  appearance: none;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition:
    color 0.12s,
    background 0.12s;
}

.tab-btn:hover {
  color: var(--text);
  background: var(--surface-2);
}

.tab-btn.active {
  color: #fff;
  background: var(--primary);
  font-weight: 600;
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

.album-scroller {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-bottom: 8px;
}

.album-card {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 8px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
}

.album-card:hover {
  background: var(--surface-2);
}

.album-cover {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.album-name {
  font-size: 14px;
  font-weight: 600;
}

.album-artist {
  font-size: 12px;
  color: var(--text-muted);
}

.album-extra {
  font-size: 11px;
  color: var(--text-faint);
  margin-top: 2px;
}

.album-chevron {
  flex-shrink: 0;
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 8px 16px;
  font-size: 12px;
  color: var(--text-faint);
  user-select: none;
}
</style>
