<script setup lang="ts">
import { ref, onMounted, onUnmounted, h, computed } from "vue";
import { NLayout, NLayoutSider, NMenu, NMessageProvider } from "naive-ui";
import type { MenuOption } from "naive-ui";
import TitleBar from "../components/TitleBar.vue";
import PlayerBar from "../components/PlayerBar.vue";
import SearchPanel from "../components/SearchPanel.vue";
import QueuePanel from "../components/QueuePanel.vue";
import LyricPanel from "../components/LyricPanel.vue";
import SettingsPanel from "../components/SettingsPanel.vue";
import DownloadModal from "../components/DownloadModal.vue";
import DownloadPanel from "../components/DownloadPanel.vue";
import Icon from "../components/Icon.vue";
import { usePlayerStore } from "../stores/player";
import { useDownloadStore } from "../stores/download";
import { provideDownloadModal } from "../composables/useDownloadModal";

const player = usePlayerStore();
const downloadStore = useDownloadStore();
const active = ref("search");
const { show: downloadShow, track: downloadTrack } = provideDownloadModal();

function renderIcon(name: string) {
  return () => h(Icon, { name, size: 18 });
}

const menuOptions = computed<MenuOption[]>(() => [
  { label: "搜索", key: "search", icon: renderIcon("ri:search-line") },
  { label: "队列", key: "queue", icon: renderIcon("ri:play-list-2-line") },
  {
    label: downloadStore.activeCount
      ? `下载 (${downloadStore.activeCount})`
      : "下载",
    key: "download",
    icon: renderIcon("ri:download-2-line"),
  },
  { label: "歌词", key: "lyric", icon: renderIcon("ri:file-music-line") },
  { label: "设置", key: "settings", icon: renderIcon("ri:settings-3-line") },
]);

function onKey(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.code === "Space") {
    e.preventDefault();
    player.toggle();
  } else if (e.code === "ArrowRight" && e.ctrlKey) {
    player.next();
  } else if (e.code === "ArrowLeft" && e.ctrlKey) {
    player.prev();
  }
}

onMounted(() => {
  player.setupRemoteControl();
  window.addEventListener("keydown", onKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <NMessageProvider>
    <div class="h-screen flex flex-col bg-[var(--bg)] text-white overflow-hidden">
      <TitleBar />
      <div class="flex-1 min-h-0 flex">
        <NLayout has-sider class="h-full bg-transparent!">
          <NLayoutSider
            bordered
            collapse-mode="width"
            :collapsed-width="64"
            :width="160"
            :native-scrollbar="false"
            class="bg-[var(--sider-bg)]!"
          >
            <NMenu
              v-model:value="active"
              :options="menuOptions"
              :collapsed-width="64"
              :collapsed-icon-size="20"
              class="mt-2"
            />
          </NLayoutSider>
          <div class="flex-1 min-w-0 min-h-0 overflow-hidden">
            <SearchPanel v-show="active === 'search'" />
            <QueuePanel v-show="active === 'queue'" />
            <DownloadPanel v-show="active === 'download'" />
            <LyricPanel v-show="active === 'lyric'" />
            <SettingsPanel v-show="active === 'settings'" />
          </div>
        </NLayout>
      </div>
      <PlayerBar />
      <DownloadModal v-model:show="downloadShow" :track="downloadTrack" />
      <div
        v-if="player.error"
        class="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg bg-red-500/90 text-sm shadow-lg z-50"
      >
        {{ player.error }}
      </div>
    </div>
  </NMessageProvider>
</template>
