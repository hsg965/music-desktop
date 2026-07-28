<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import Icon from "./Icon.vue";

const appWindow = getCurrentWindow();

async function minimize() {
  await appWindow.minimize();
}

async function toggleMaximize() {
  if (await appWindow.isMaximized()) {
    await appWindow.unmaximize();
  } else {
    await appWindow.maximize();
  }
}

async function close() {
  // 关闭行为由 Rust 侧 CloseRequested 处理（隐藏到托盘）
  await appWindow.close();
}
</script>

<template>
  <header
    class="title-bar h-10 flex items-center justify-between px-3 select-none bg-[var(--bar-bg)] border-b border-white/5"
    data-tauri-drag-region
  >
    <div class="flex items-center gap-2 text-sm text-white/80" data-tauri-drag-region>
      <Icon name="ri:music-2-fill" :size="18" color="#7c6af7" />
      <span class="font-medium tracking-wide">Music Desktop</span>
    </div>
    <div class="flex items-center gap-0.5">
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
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.75);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.win-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.win-btn-close:hover {
  background: #e81123;
  color: #fff;
}
</style>
