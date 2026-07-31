<script setup lang="ts">
import { NButton, NEmpty, NTag, NTooltip } from "naive-ui";
import { useDownloadStore, type DownloadStatus } from "../stores/download";
import { BITRATE_OPTIONS } from "../api/music";
import Icon from "./Icon.vue";

const store = useDownloadStore();

function artistText(artists: string[]) {
  return (artists || []).join(" / ") || "未知歌手";
}

function brLabel(br: number) {
  return BITRATE_OPTIONS.find((b) => b.value === br)?.label || `${br}`;
}

function statusMeta(s: DownloadStatus): { label: string; type: "default" | "info" | "success" | "error" | "warning" } {
  switch (s) {
    case "pending":
      return { label: "等待中", type: "default" };
    case "downloading":
      return { label: "下载中", type: "info" };
    case "done":
      return { label: "已完成", type: "success" };
    case "failed":
      return { label: "失败", type: "error" };
    case "cancelled":
      return { label: "已取消", type: "warning" };
  }
}

function shortPath(p: string) {
  if (p.length <= 48) return p;
  return "…" + p.slice(-46);
}
</script>

<template>
  <div class="page-root">
    <header class="page-header">
      <div>
        <h1 class="page-title">下载</h1>
        <p class="page-subtitle">
          <template v-if="store.activeCount">{{ store.activeCount }} 项进行中</template>
          <template v-else>共 {{ store.tasks.length }} 项任务</template>
        </p>
      </div>
      <NButton
        size="small"
        quaternary
        :disabled="!store.tasks.some((t) => t.status === 'done' || t.status === 'failed')"
        @click="store.clearFinished()"
      >
        清除已完成
      </NButton>
    </header>

    <div class="page-body">
      <div class="page-scroll content-list">
        <template v-if="store.tasks.length">
          <div
            v-for="task in store.tasks"
            :key="task.id"
            class="dl-row flex items-start gap-3 px-3 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm truncate" style="color: var(--text)">{{ task.track.name }}</span>
                <NTag size="tiny" :type="statusMeta(task.status).type" :bordered="false">
                  {{ statusMeta(task.status).label }}
                </NTag>
                <span class="text-xs" style="color: var(--text-faint)">{{ brLabel(task.br) }}</span>
              </div>
              <div class="text-xs mt-0.5 truncate" style="color: var(--text-muted)">
                {{ artistText(task.track.artist) }}
              </div>
              <div class="text-xs mt-1 truncate" style="color: var(--text-faint)" :title="task.path">
                {{ shortPath(task.path) }}
              </div>
              <div v-if="task.error" class="text-xs text-red-400/90 mt-1 break-all">
                {{ task.error }}
              </div>
            </div>
            <div class="flex items-center gap-0.5 shrink-0">
              <NTooltip v-if="task.status === 'failed'">
                <template #trigger>
                  <NButton quaternary circle size="small" @click="store.retry(task.id)">
                    <Icon name="ri:refresh-line" :size="16" />
                  </NButton>
                </template>
                重试
              </NTooltip>
              <NTooltip v-if="task.status !== 'downloading'">
                <template #trigger>
                  <NButton quaternary circle size="small" @click="store.remove(task.id)">
                    <Icon name="ri:close-line" :size="16" />
                  </NButton>
                </template>
                移除
              </NTooltip>
              <Icon
                v-else
                name="ri:loader-4-line"
                :size="18"
                class="animate-spin m-1"
                color="var(--primary)"
              />
            </div>
          </div>
        </template>
        <div v-else class="empty-box">
          <NEmpty description="暂无下载任务，在歌曲旁点下载即可" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.empty-box {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dl-row {
  border-radius: var(--radius-sm);
  background: transparent;
}
.dl-row:hover {
  background: var(--surface-2);
}
</style>
