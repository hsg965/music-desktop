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
import UpdateDialog from "../components/UpdateDialog.vue";
import ThemeDecor from "../components/ThemeDecor.vue";
import Icon from "../components/Icon.vue";
import { usePlayerStore } from "../stores/player";
import { useDownloadStore } from "../stores/download";
import { useSettingsStore } from "../stores/settings";
import { provideDownloadModal } from "../composables/useDownloadModal";
import { useUpdater } from "../composables/useUpdater";
import { getSkin } from "../themes/apply";

const player = usePlayerStore();
const downloadStore = useDownloadStore();
const settings = useSettingsStore();
const { scheduleSilentCheck } = useUpdater();
const active = ref("search");
const { show: downloadShow, track: downloadTrack } = provideDownloadModal();

const skin = computed(() => getSkin(settings.skinId));
const siderWidth = computed(() => {
  const w = parseInt(skin.value.tokens["sider-width"], 10);
  return Number.isFinite(w) ? w : 160;
});
const collapsedWidth = computed(() =>
  skin.value.layout === "neon-rail" ? 72 : 64,
);

function renderIcon(name: string) {
  return () => h(Icon, { name, size: 18 });
}

const menuOptions = computed<MenuOption[]>(() => {
  const neon = skin.value.layout === "neon-rail";
  return [
    {
      label: neon ? "" : "搜索",
      key: "search",
      icon: renderIcon("ri:search-line"),
    },
    {
      label: neon ? "" : "队列",
      key: "queue",
      icon: renderIcon("ri:play-list-2-line"),
    },
    {
      label: neon
        ? ""
        : downloadStore.activeCount
          ? `下载 (${downloadStore.activeCount})`
          : "下载",
      key: "download",
      icon: renderIcon("ri:download-2-line"),
    },
    {
      label: neon ? "" : "歌词",
      key: "lyric",
      icon: renderIcon("ri:file-music-line"),
    },
    {
      label: neon ? "" : "设置",
      key: "settings",
      icon: renderIcon("ri:settings-3-line"),
    },
  ];
});

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
  // 启动后延迟静默检查更新（仅有新版本时弹窗）
  scheduleSilentCheck(4000);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <NMessageProvider>
    <div class="app-shell h-screen flex flex-col overflow-hidden">
      <ThemeDecor />
      <TitleBar />
      <div class="layout-body flex-1 min-h-0 flex">
        <NLayout has-sider class="h-full bg-transparent!">
          <NLayoutSider
            bordered
            collapse-mode="width"
            :collapsed-width="collapsedWidth"
            :width="siderWidth"
            :show-collapsed-content="true"
            :native-scrollbar="false"
            class="layout-sider"
            :style="{
              background: 'var(--sider-bg)',
              borderColor: 'var(--border)',
            }"
          >
            <NMenu
              v-model:value="active"
              :options="menuOptions"
              :collapsed="skin.layout === 'neon-rail'"
              :collapsed-width="collapsedWidth"
              :collapsed-icon-size="22"
              class="mt-2"
            />
          </NLayoutSider>
          <div class="layout-content flex-1 min-w-0 min-h-0 overflow-hidden">
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
      <UpdateDialog />
      <div
        v-if="player.error"
        class="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm shadow-lg z-50"
        style="background: rgba(232, 17, 35, 0.92); color: #fff"
      >
        {{ player.error }}
      </div>
    </div>
  </NMessageProvider>
</template>
