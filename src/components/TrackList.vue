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
  }>(),
  {
    showIndex: true,
    removable: false,
    virtual: true,
  },
);

const emit = defineEmits<{
  play: [track: Track];
  add: [track: Track];
  remove: [index: number];
  download: [track: Track];
}>();

const ROW_H = 52;
const OVERSCAN = 8;

const scroller = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportH = ref(480);

/** 用 shallowRef 减少大数组响应式开销 */
const list = shallowRef<Track[]>([]);

watch(
  () => props.tracks,
  (v) => {
    list.value = v;
    // 切歌单时回到顶部
    if (scroller.value) scroller.value.scrollTop = 0;
    scrollTop.value = 0;
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

function artistText(t: Track) {
  return (t.artist || []).join(" / ") || "未知歌手";
}

function trackKey(t: Track) {
  return `${t.source}-${t.id}`;
}

function onScroll() {
  const el = scroller.value;
  if (!el) return;
  scrollTop.value = el.scrollTop;
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
  });
  ro.observe(el);
});

onUnmounted(() => {
  scroller.value?.removeEventListener("scroll", onScroll);
  ro?.disconnect();
});
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

        <div class="col-album truncate">{{ track.album || "—" }}</div>

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
