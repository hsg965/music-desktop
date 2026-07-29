<script setup lang="ts">
import { computed } from "vue";
import { NButton, NEmpty, useMessage } from "naive-ui";
import { usePlayerStore } from "../stores/player";
import TrackList from "./TrackList.vue";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";

const player = usePlayerStore();
const message = useMessage();
const { open: openDownload } = useDownloadModal();

const activeKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

function onPlay(track: import("../types/music").Track) {
  const idx = player.queue.findIndex(
    (t) => `${t.source}-${t.id}` === `${track.source}-${track.id}`,
  );
  if (idx >= 0) player.playAt(idx);
}

function onRemove(index: number) {
  player.removeFromQueue(index);
}

function clear() {
  player.clearQueue();
  message.success("已清空队列");
}
</script>

<template>
  <div class="h-full flex flex-col gap-3 p-4">
    <div class="flex items-center justify-between">
      <div class="text-sm" style="color: var(--text-muted)">
        播放队列
        <span class="ml-1" style="color: var(--text-faint)">({{ player.queue.length }})</span>
      </div>
      <NButton
        size="small"
        quaternary
        :disabled="!player.queue.length"
        @click="clear"
      >
        <template #icon>
          <Icon name="ri:delete-bin-line" :size="14" />
        </template>
        清空
      </NButton>
    </div>

    <div class="flex-1 min-h-0 overflow-auto skin-panel">
      <TrackList
        v-if="player.queue.length"
        :tracks="player.queue"
        :active-key="activeKey"
        removable
        @play="onPlay"
        @remove="onRemove"
        @download="openDownload"
      />
      <div v-else class="h-60 flex items-center justify-center">
        <NEmpty description="队列为空，去搜索添加歌曲吧" />
      </div>
    </div>
  </div>
</template>
