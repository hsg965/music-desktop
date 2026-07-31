<script setup lang="ts">
import Icon from "./Icon.vue";
import { openThemePicker } from "../utils/windows";

async function getWin() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return getCurrentWindow();
  } catch {
    return null;
  }
}

async function minimize() {
  const win = await getWin();
  await win?.minimize();
}

async function toggleMaximize() {
  const win = await getWin();
  if (!win) return;
  if (await win.isMaximized()) {
    await win.unmaximize();
  } else {
    await win.maximize();
  }
}

async function close() {
  const win = await getWin();
  await win?.close();
}

async function openThemes() {
  await openThemePicker();
}
</script>

<template>
  <header class="title-bar" data-tauri-drag-region>
    <div class="title-left" data-tauri-drag-region>
      <span class="title-hint" data-tauri-drag-region>本地音乐客户端</span>
    </div>
    <div class="title-actions no-drag">
      <button type="button" class="win-btn" title="主题" @click.stop="openThemes">
        <Icon name="ri:palette-line" :size="15" />
      </button>
      <button type="button" class="win-btn" title="最小化" @click="minimize">
        <Icon name="ri:subtract-line" :size="15" />
      </button>
      <button type="button" class="win-btn" title="最大化" @click="toggleMaximize">
        <Icon name="ri:checkbox-blank-line" :size="13" />
      </button>
      <button
        type="button"
        class="win-btn win-btn-close"
        title="关闭到托盘"
        @click="close"
      >
        <Icon name="ri:close-line" :size="15" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 14px;
  user-select: none;
}

.title-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
}

.title-hint {
  font-size: 12px;
  color: var(--text-faint);
}

.title-actions {
  display: flex;
  align-items: stretch;
  height: 100%;
}

.win-btn {
  width: 46px;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.12s,
    color 0.12s;
}

.win-btn:hover {
  background: var(--surface-2);
  color: var(--text);
}

.win-btn-close:hover {
  background: #e81123;
  color: #fff;
}
</style>
