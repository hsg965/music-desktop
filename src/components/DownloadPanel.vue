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
  <div class="download-root h-full min-h-0 flex flex-col gap-3 p-4">
    <div class="flex items-center justify-between gap-2 shrink-0">
      <div class="text-sm" style="color: var(--text-muted)">
        下载列表
        <span v-if="store.activeCount" class="ml-1" style="color: var(--primary)">
          ({{ store.activeCount }} 进行中)
        </span>
        <span v-else class="ml-1" style="color: var(--text-faint)">({{ store.tasks.length }})</span>
      </div>
      <div class="flex gap-1">
        <NButton
          size="small"
          quaternary
          :disabled="!store.tasks.some((t) => t.status === 'done' || t.status === 'failed')"
          @click="store.clearFinished()"
        >
          清除已完成
        </NButton>
      </div>
    </div>

    <div class="list-shell flex-1 min-h-0 skin-panel flex flex-col">
      <div class="list-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
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
        <div v-else class="h-60 flex items-center justify-center">
          <NEmpty description="暂无下载任务，在歌曲旁点下载即可" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.download-root {
  box-sizing: border-box;
}

.list-shell {
  min-height: 0;
}

.list-scroll {
  overscroll-behavior: contain;
}

.dl-row {
  border-bottom: 1px solid var(--border);
  background: transparent;
}
.dl-row:nth-child(even) {
  background: rgba(127, 127, 127, 0.04);
}
.dl-row:hover {
  background: rgba(127, 127, 127, 0.1);
}
html[data-mode="light"] .dl-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.28);
}
html[data-mode="light"] .dl-row:hover {
  background: rgba(255, 255, 255, 0.45);
}
</style>
