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
  <header
    class="title-bar h-10 flex items-center justify-between px-3 select-none border-b"
    style="background: var(--bar-bg); border-color: var(--border); color: var(--text)"
    data-tauri-drag-region
  >
    <div
      class="flex items-center gap-2 text-sm"
      style="color: var(--text-muted)"
      data-tauri-drag-region
    >
      <Icon name="ri:music-2-fill" :size="18" color="var(--primary)" />
      <span class="font-medium tracking-wide" style="color: var(--text)">
        Music Desktop
      </span>
    </div>
    <div class="flex items-center gap-0.5 no-drag">
      <button type="button" class="win-btn" title="主题皮肤" @click.stop="openThemes">
        <Icon name="ri:palette-line" :size="16" />
      </button>
      <button class="win-btn" title="最小化" @click="minimize">
        <Icon name="ri:subtract-line" :size="16" />
      </button>
      <button class="win-btn" title="最大化" @click="toggleMaximize">
        <Icon name="ri:checkbox-blank-line" :size="14" />
      </button>
      <button class="win-btn win-btn-close" title="关闭到托盘" @click="close">
        <Icon name="ri:close-line" :size="16" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.win-btn {
  width: 36px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm, 6px);
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition:
    background 0.15s,
    color 0.15s;
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
