<script setup lang="ts">
import { NButton, NTooltip } from "naive-ui";
import type { Track } from "../types/music";
import Icon from "./Icon.vue";

const props = withDefaults(
  defineProps<{
    tracks: Track[];
    showIndex?: boolean;
    activeKey?: string;
    /** 队列模式：显示移除而非加入 */
    removable?: boolean;
  }>(),
  {
    showIndex: true,
    removable: false,
  },
);

const emit = defineEmits<{
  play: [track: Track];
  add: [track: Track];
  remove: [index: number];
  download: [track: Track];
}>();

function artistText(t: Track) {
  return (t.artist || []).join(" / ") || "未知歌手";
}

function trackKey(t: Track) {
  return `${t.source}-${t.id}`;
}
</script>

<template>
  <div class="track-list">
    <div
      v-for="(track, i) in tracks"
      :key="trackKey(track)"
      class="track-row group"
      :class="{ active: activeKey === trackKey(track) }"
      @dblclick="emit('play', track)"
    >
      <div class="w-8 text-center text-xs text-white/35 tabular-nums">
        {{ props.showIndex ? i + 1 : "" }}
      </div>
      <div class="flex-1 min-w-0">
        <div class="truncate text-sm text-white/90 group-[.active]:text-[#a89bff]">
          {{ track.name }}
        </div>
        <div class="truncate text-xs text-white/40 mt-0.5">
          {{ artistText(track) }}
          <span v-if="track.album" class="mx-1 opacity-50">·</span>
          <span v-if="track.album">{{ track.album }}</span>
        </div>
      </div>
      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle size="small" @click.stop="emit('play', track)">
              <Icon name="ri:play-fill" :size="16" />
            </NButton>
          </template>
          播放
        </NTooltip>
        <NTooltip v-if="!removable">
          <template #trigger>
            <NButton quaternary circle size="small" @click.stop="emit('add', track)">
              <Icon name="ri:play-list-add-line" :size="16" />
            </NButton>
          </template>
          加入队列
        </NTooltip>
        <NTooltip>
          <template #trigger>
            <NButton quaternary circle size="small" @click.stop="emit('download', track)">
              <Icon name="ri:download-2-line" :size="16" />
            </NButton>
          </template>
          下载
        </NTooltip>
        <NTooltip v-if="removable">
          <template #trigger>
            <NButton quaternary circle size="small" @click.stop="emit('remove', i)">
              <Icon name="ri:delete-bin-line" :size="16" />
            </NButton>
          </template>
          移除
        </NTooltip>
      </div>
    </div>
  </div>
</template>

<style scoped>
.track-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: default;
  transition: background 0.15s;
}
.track-row:hover,
.track-row.active {
  background: rgba(255, 255, 255, 0.04);
}
</style>
