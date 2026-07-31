<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import type { Track } from "../types/music";
import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    tracks: Track[];
    showIndex?: boolean;
    activeKey?: string;
    removable?: boolean;
    /** 是否启用虚拟列表（长列表默认开） */
    virtual?: boolean;
    /** 专辑名可点击（仅搜索等入口开启） */
    albumLink?: boolean;
    /** 启用滚动加载（展示底部状态文案） */
    infinite?: boolean;
    /** 是否还有更多 */
    hasMore?: boolean;
    /** 正在加载更多 */
    loadingMore?: boolean;
  }>(),
  {
    showIndex: true,
    removable: false,
    virtual: true,
    albumLink: false,
    infinite: false,
    hasMore: false,
    loadingMore: false,
  },
);

const emit = defineEmits<{
  play: [track: Track];
  add: [track: Track];
  remove: [index: number];
  download: [track: Track];
  openAlbum: [track: Track];
  /** 接近底部时触发，父级应加载下一页 */
  loadMore: [];
}>();

function canOpenAlbum(t: Track) {
  if (!props.albumLink) return false;
  const name = (t.album || "").trim();
  return !!name && name !== "—" && name !== "未知专辑";
}

function onAlbumClick(track: Track, e: Event) {
  e.stopPropagation();
  if (!canOpenAlbum(track)) return;
  emit("openAlbum", track);
}

const ROW_H = 52;
const OVERSCAN = 8;
/** 距底部多少 px 触发加载更多 */
const LOAD_MORE_OFFSET = 120;

const scroller = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportH = ref(480);

/** 用 shallowRef 减少大数组响应式开销 */
const list = shallowRef<Track[]>([]);

function trackKey(t: Track) {
  return `${t.source}-${t.id}`;
}

function isAppendUpdate(prev: Track[], next: Track[]) {
  if (!prev.length || next.length <= prev.length) return false;
  return (
    trackKey(prev[0]) === trackKey(next[0]) &&
    trackKey(prev[prev.length - 1]) === trackKey(next[prev.length - 1])
  );
}

watch(
  () => props.tracks,
  (v) => {
    const prev = list.value;
    const append = isAppendUpdate(prev, v);
    list.value = v;
    // 整表替换时回顶；滚动追加时保持位置
    if (!append) {
      if (scroller.value) scroller.value.scrollTop = 0;
      scrollTop.value = 0;
    }
  },
  { immediate: true },
);

const useVirtual = computed(
  () => props.virtual !== false && list.value.length > 40,
);

const totalH = computed(() => list.value.length * ROW_H);

const range = computed(() => {
  if (!useVirtual.value) {
    return { start: 0, end: list.value.length };
  }
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_H) - OVERSCAN);
  const visible = Math.ceil(viewportH.value / ROW_H) + OVERSCAN * 2;
  const end = Math.min(list.value.length, start + visible);
  return { start, end };
});

const visibleTracks = computed(() => {
  const { start, end } = range.value;
  return list.value.slice(start, end).map((track, i) => ({
    track,
    index: start + i,
  }));
});

const padTop = computed(() =>
  useVirtual.value ? range.value.start * ROW_H : 0,
);
const padBottom = computed(() =>
  useVirtual.value
    ? Math.max(0, totalH.value - range.value.end * ROW_H)
    : 0,
);

const showFooter = computed(
  () => props.infinite && list.value.length > 0,
);

const footerText = computed(() => {
  if (props.loadingMore) return "加载中…";
  if (props.hasMore) return "滚动加载更多（无数据时可再滚一次重试）";
  return "没有更多了";
});

function artistText(t: Track) {
  return (t.artist || []).join(" / ") || "未知歌手";
}

function checkLoadMore() {
  const el = scroller.value;
  if (!el || !props.infinite || !props.hasMore || props.loadingMore) return;
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (remain <= LOAD_MORE_OFFSET) {
    emit("loadMore");
  }
}

function onScroll() {
  const el = scroller.value;
  if (!el) return;
  scrollTop.value = el.scrollTop;
  checkLoadMore();
}

let ro: ResizeObserver | null = null;

onMounted(() => {
  const el = scroller.value;
  if (!el) return;
  viewportH.value = el.clientHeight || 480;
  el.addEventListener("scroll", onScroll, { passive: true });
  ro = new ResizeObserver((entries) => {
    const h = entries[0]?.contentRect.height;
    if (h) viewportH.value = h;
    // 内容不足一屏时补一次（仅首屏填充，不在空响应后连发）
    checkLoadMore();
  });
  ro.observe(el);
});

onUnmounted(() => {
  scroller.value?.removeEventListener("scroll", onScroll);
  ro?.disconnect();
});

// 列表成功变长且仍贴底时再补拉；空响应结束 loading 后不自动连发（避免限流空数据死循环）
watch(
  () => props.tracks.length,
  (n, o) => {
    if (n > (o ?? 0)) {
      requestAnimationFrame(() => checkLoadMore());
    }
  },
);
</script>

<template>
  <div ref="scroller" class="track-list-scroller">
    <div class="track-list" :style="useVirtual ? { minHeight: totalH + 36 + 'px' } : undefined">
      <div class="track-head">
        <div class="col-idx">#</div>
        <div class="col-main">标题</div>
        <div class="col-album">专辑</div>
        <div class="col-actions" />
      </div>

      <div v-if="useVirtual" class="pad" :style="{ height: padTop + 'px' }" />

      <div
        v-for="{ track, index } in visibleTracks"
        :key="trackKey(track)"
        class="track-row"
        :class="{ active: activeKey === trackKey(track) }"
        :style="{ height: ROW_H + 'px' }"
        @dblclick="emit('play', track)"
      >
        <div class="col-idx">
          <span
            class="idx-num"
            :class="{ hide: activeKey === trackKey(track) }"
          >
            {{ props.showIndex ? index + 1 : "" }}
          </span>
          <button
            type="button"
            class="idx-play"
            :class="{ show: activeKey === trackKey(track) }"
            title="播放"
            @click.stop="emit('play', track)"
          >
            <Icon name="ri:play-fill" :size="14" />
          </button>
        </div>

        <div class="col-main">
          <div class="thumb">
            <img
              v-if="track.picUrl"
              :src="track.picUrl"
              alt=""
              loading="lazy"
              decoding="async"
              referrerpolicy="no-referrer"
            />
            <Icon
              v-else
              name="ri:music-2-line"
              :size="14"
              color="var(--text-faint)"
            />
          </div>
          <div class="meta min-w-0">
            <div class="truncate text-sm track-name">{{ track.name }}</div>
            <div class="truncate text-xs artist">{{ artistText(track) }}</div>
          </div>
        </div>

        <div class="col-album truncate">
          <button
            v-if="canOpenAlbum(track)"
            type="button"
            class="album-link truncate"
            :title="`查看专辑：${track.album}`"
            @click="onAlbumClick(track, $event)"
          >
            {{ track.album }}
          </button>
          <span v-else>{{ track.album || "—" }}</span>
        </div>

        <div class="col-actions">
          <button
            type="button"
            class="act-btn"
            title="播放"
            @click.stop="emit('play', track)"
          >
            <Icon name="ri:play-fill" :size="15" />
          </button>
          <button
            v-if="!removable"
            type="button"
            class="act-btn"
            title="加入队列"
            @click.stop="emit('add', track)"
          >
            <Icon name="ri:play-list-add-line" :size="15" />
          </button>
          <button
            type="button"
            class="act-btn"
            title="下载"
            @click.stop="emit('download', track)"
          >
            <Icon name="ri:download-2-line" :size="15" />
          </button>
          <button
            v-if="removable"
            type="button"
            class="act-btn"
            title="移除"
            @click.stop="emit('remove', index)"
          >
            <Icon name="ri:delete-bin-line" :size="15" />
          </button>
        </div>
      </div>

      <div v-if="useVirtual" class="pad" :style="{ height: padBottom + 'px' }" />

      <div v-if="showFooter" class="list-footer">
        <span v-if="loadingMore" class="footer-spin" aria-hidden="true" />
        <span>{{ footerText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-list-scroller {
  height: 100%;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

.track-list {
  padding-bottom: 8px;
}

.track-head {
  position: sticky;
  top: 0;
  z-index: 2;
  display: grid;
  grid-template-columns: 40px minmax(0, 1.4fr) minmax(0, 1fr) 108px;
  gap: 8px;
  align-items: center;
  padding: 0 10px 8px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
  user-select: none;
}

.track-row {
  display: grid;
  grid-template-columns: 40px minmax(0, 1.4fr) minmax(0, 1fr) 108px;
  gap: 8px;
  align-items: center;
  padding: 0 10px;
  cursor: default;
  color: var(--text);
  content-visibility: auto;
  contain-intrinsic-size: auto 52px;
}

.track-row:hover {
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.track-row.active {
  background: var(--primary-soft);
  border-radius: var(--radius-sm);
}

.col-idx {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-faint);
}

.idx-num.hide {
  opacity: 0;
}

.idx-play {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  padding: 0;
}

.idx-play.show,
.track-row:hover .idx-play {
  display: flex;
}

.track-row:hover .idx-num {
  opacity: 0;
}

.col-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meta {
  min-width: 0;
}

.track-name {
  color: var(--text);
  font-weight: 500;
}

.track-row.active .track-name {
  color: var(--primary);
  font-weight: 600;
}

.artist {
  margin-top: 2px;
  color: var(--text-faint);
}

.col-album {
  font-size: 12px;
  color: var(--text-muted);
}

.album-link {
  max-width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  text-align: left;
}

.album-link:hover {
  color: var(--primary);
  text-decoration: underline;
}

.col-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  opacity: 0;
}

.track-row:hover .col-actions,
.track-row.active .col-actions {
  opacity: 1;
}

.act-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0;
}

.act-btn:hover {
  color: var(--text);
  background: var(--surface);
}

.pad {
  width: 100%;
  pointer-events: none;
}

.list-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 8px 16px;
  font-size: 12px;
  color: var(--text-faint);
  user-select: none;
}

.footer-spin {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: track-spin 0.7s linear infinite;
}

@keyframes track-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 860px) {
  .track-head,
  .track-row {
    grid-template-columns: 36px minmax(0, 1fr) 96px;
  }
  .col-album {
    display: none;
  }
}
</style>
