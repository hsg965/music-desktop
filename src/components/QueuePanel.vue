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
  <div class="page-root">
    <header class="page-header">
      <div>
        <h1 class="page-title">播放队列</h1>
        <p class="page-subtitle">共 {{ player.queue.length }} 首</p>
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
    </header>

    <div class="page-body list-body">
      <TrackList
        v-if="player.queue.length"
        :tracks="player.queue"
        :active-key="activeKey"
        removable
        @play="onPlay"
        @remove="onRemove"
        @download="openDownload"
      />
      <div v-else class="empty-box">
        <NEmpty description="队列为空，去热榜或搜索添加歌曲" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-body {
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.empty-box {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
