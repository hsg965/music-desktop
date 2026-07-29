<script setup lang="ts">
import {
  NModal,
  NButton,
  NProgress,
  NSpin,
  NSpace,
  NAlert,
} from "naive-ui";
import { useUpdater } from "../composables/useUpdater";

const {
  phase,
  currentVersion,
  availableVersion,
  releaseNotes,
  errorMessage,
  downloadPercent,
  dialogVisible,
  isBusy,
  downloadAndInstall,
  openGitHubReleases,
  closeDialog,
  checkForUpdate,
} = useUpdater();

function onUpdateShow(v: boolean) {
  if (!v) closeDialog();
}
</script>

<template>
  <NModal
    :show="dialogVisible"
    preset="card"
    title="软件更新"
    style="width: min(440px, 92vw)"
    :mask-closable="!isBusy || phase === 'checking'"
    :closable="!isBusy || phase === 'checking'"
    @update:show="onUpdateShow"
  >
    <div class="space-y-3 text-sm" style="color: var(--text)">
      <div style="color: var(--text-muted)">
        当前版本
        <b style="color: var(--text)">{{ currentVersion || "…" }}</b>
      </div>

      <!-- 检查中 -->
      <div v-if="phase === 'checking'" class="flex items-center gap-2 py-2">
        <NSpin size="small" />
        <span>正在检查更新…</span>
      </div>

      <!-- 已是最新 -->
      <NAlert v-else-if="phase === 'up-to-date'" type="success" :bordered="false">
        已是最新版本
      </NAlert>

      <!-- 有新版本 -->
      <template v-else-if="phase === 'available' || phase === 'downloading' || phase === 'installing'">
        <div>
          发现新版本
          <b style="color: var(--primary)">{{ availableVersion }}</b>
        </div>
        <div
          v-if="releaseNotes"
          class="max-h-40 overflow-auto rounded-md p-2 text-xs whitespace-pre-wrap"
          style="background: var(--surface); color: var(--text-muted)"
        >
          {{ releaseNotes }}
        </div>
        <div v-else class="text-xs" style="color: var(--text-faint)">
          暂无更新说明
        </div>

        <div v-if="phase === 'downloading' || phase === 'installing'" class="space-y-1">
          <div class="text-xs" style="color: var(--text-muted)">
            {{ phase === "installing" ? "正在安装并准备重启…" : "正在下载更新包…" }}
          </div>
          <NProgress
            type="line"
            :percentage="downloadPercent ?? 0"
            :processing="phase === 'downloading' && downloadPercent == null"
            :show-indicator="downloadPercent != null"
            status="success"
          />
        </div>
      </template>

      <!-- 错误：仅引导 GitHub -->
      <template v-else-if="phase === 'error'">
        <NAlert type="error" :bordered="false" title="更新失败">
          {{ errorMessage }}
        </NAlert>
        <div class="text-xs" style="color: var(--text-faint)">
          若网络无法访问 GitHub，请稍后重试，或前往 Releases 页面手动下载安装包。
        </div>
      </template>
    </div>

    <template #footer>
      <NSpace justify="end">
        <NButton
          v-if="phase === 'error'"
          secondary
          :disabled="isBusy"
          @click="openGitHubReleases"
        >
          打开 GitHub 下载
        </NButton>
        <NButton
          v-if="phase === 'error'"
          secondary
          :disabled="isBusy"
          @click="checkForUpdate(false)"
        >
          重试
        </NButton>
        <NButton
          v-if="phase === 'available'"
          type="primary"
          :loading="false"
          @click="downloadAndInstall"
        >
          下载并安装
        </NButton>
        <NButton
          v-if="phase !== 'downloading' && phase !== 'installing'"
          :disabled="phase === 'checking'"
          @click="closeDialog"
        >
          {{ phase === "available" ? "稍后" : "关闭" }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
