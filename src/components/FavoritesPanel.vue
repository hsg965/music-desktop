<script setup lang="ts">
import { computed, ref } from "vue";
import { NButton, NEmpty, useMessage, useDialog } from "naive-ui";
import { usePlayerStore } from "../stores/player";
import { useFavoritesStore } from "../stores/favorites";
import TrackList from "./TrackList.vue";
import Icon from "./Icon.vue";
import { useDownloadModal } from "../composables/useDownloadModal";
import type { Track } from "../types/music";

const player = usePlayerStore();
const favorites = useFavoritesStore();
const message = useMessage();
const dialog = useDialog();
const { open: openDownload } = useDownloadModal();
const playingAll = ref(false);

const activeKey = computed(() => {
  const t = player.currentTrack;
  return t ? `${t.source}-${t.id}` : "";
});

async function onPlay(track: Track) {
  await player.playTrack(track);
  if (player.error) message.error(player.error);
}

function onAdd(track: Track) {
  player.addToQueue(track);
  message.success("已加入队列");
}

async function playAll() {
  if (!favorites.tracks.length) return;
  playingAll.value = true;
  try {
    await player.playAll(favorites.tracks, 0);
    if (player.error) message.error(player.error);
    else message.success(`已开始播放，共 ${favorites.count} 首`);
  } finally {
    playingAll.value = false;
  }
}

function addAllToQueue() {
  if (!favorites.tracks.length) return;
  const before = player.queue.length;
  player.addManyToQueue(favorites.tracks);
  const added = player.queue.length - before;
  message.success(added > 0 ? `已加入 ${added} 首到队列` : "歌曲已在队列中");
}

function confirmClear() {
  if (!favorites.count) return;
  dialog.warning({
    title: "清空我喜欢的音乐",
    content: `确定取消收藏全部 ${favorites.count} 首歌吗？此操作不可撤销。`,
    positiveText: "清空",
    negativeText: "取消",
    onPositiveClick: () => {
      favorites.clear();
      message.success("已清空收藏");
    },
  });
}
</script>

<template>
  <div class="page-root">
    <header class="page-header fav-header">
      <div class="fav-title-row">
        <div class="fav-icon" aria-hidden="true">
          <Icon name="ri:heart-3-fill" :size="22" />
        </div>
        <div>
          <h1 class="page-title">我喜欢的音乐</h1>
          <p class="page-subtitle">
            共 {{ favorites.count }} 首 · 本地收藏，仅保存在本机
          </p>
        </div>
      </div>
      <div class="fav-actions">
        <NButton
          type="primary"
          size="small"
          :disabled="!favorites.count"
          :loading="playingAll"
          @click="playAll"
        >
          <template #icon>
            <Icon name="ri:play-fill" :size="14" />
          </template>
          播放全部
        </NButton>
        <NButton size="small" :disabled="!favorites.count" @click="addAllToQueue">
          <template #icon>
            <Icon name="ri:play-list-add-line" :size="14" />
          </template>
          加入队列
        </NButton>
        <NButton
          size="small"
          quaternary
          :disabled="!favorites.count"
          @click="confirmClear"
        >
          <template #icon>
            <Icon name="ri:delete-bin-line" :size="14" />
          </template>
          清空
        </NButton>
      </div>
    </header>

    <div class="page-body list-body">
      <TrackList
        v-if="favorites.tracks.length"
        :tracks="favorites.tracks"
        :active-key="activeKey"
        @play="onPlay"
        @add="onAdd"
        @download="openDownload"
      />
      <div v-else class="empty-box">
        <NEmpty description="还没有收藏歌曲，在列表或播放条点红心即可加入">
          <template #icon>
            <Icon name="ri:heart-3-line" :size="40" color="var(--text-faint)" />
          </template>
        </NEmpty>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fav-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.fav-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.fav-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--primary) 18%, transparent);
  color: var(--primary);
}

.fav-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

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
