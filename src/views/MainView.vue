<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NMessageProvider } from "naive-ui";
import TitleBar from "../components/TitleBar.vue";
import PlayerBar from "../components/PlayerBar.vue";
import ChartsPanel from "../components/ChartsPanel.vue";
import SearchPanel from "../components/SearchPanel.vue";
import AlbumPanel from "../components/AlbumPanel.vue";
import QueuePanel from "../components/QueuePanel.vue";
import DownloadModal from "../components/DownloadModal.vue";
import DownloadPanel from "../components/DownloadPanel.vue";
import UpdateDialog from "../components/UpdateDialog.vue";
import ImmersiveLyric from "../components/ImmersiveLyric.vue";
import Icon from "../components/Icon.vue";
import { usePlayerStore } from "../stores/player";
import { useDownloadStore } from "../stores/download";
import { provideDownloadModal } from "../composables/useDownloadModal";
import { useUpdater } from "../composables/useUpdater";
import { useImmersiveLyric } from "../composables/useImmersiveLyric";
import { openSettingsWindow } from "../utils/windows";

type NavKey = "charts" | "search" | "queue" | "download";

interface NavItem {
  key: NavKey;
  label: string;
  icon: string;
}

const route = useRoute();
const router = useRouter();
const player = usePlayerStore();
const downloadStore = useDownloadStore();
const { scheduleSilentCheck } = useUpdater();
const { open: lyricOpen, hide: hideLyric } = useImmersiveLyric();
const active = ref<NavKey>("charts");
const { show: downloadShow, track: downloadTrack } = provideDownloadModal();

/** 专辑页：独立路由，侧栏仍显示「搜索」选中 */
const isAlbumRoute = computed(() => route.name === "album");

const browseItems: NavItem[] = [
  { key: "charts", label: "热榜", icon: "ri:fire-fill" },
  { key: "search", label: "搜索", icon: "ri:search-line" },
];

const libraryItems = computed<NavItem[]>(() => [
  { key: "queue", label: "播放队列", icon: "ri:play-list-2-line" },
  { key: "download", label: "下载", icon: "ri:download-2-line" },
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

function goNav(key: NavKey) {
  if (lyricOpen.value) hideLyric();
  // 从专辑离开时清掉路由，侧栏项本身不变
  if (isAlbumRoute.value) {
    router.replace({ name: "main" });
  }
  active.value = key;
}

async function openSettings() {
  if (lyricOpen.value) hideLyric();
  await openSettingsWindow();
}

onMounted(() => {
  player.setupRemoteControl();
  window.addEventListener("keydown", onKey);
  scheduleSilentCheck(4000);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKey);
});
</script>

<template>
  <NMessageProvider>
    <div class="app-shell h-screen flex flex-col overflow-hidden">
      <TitleBar />

      <div class="workspace">
        <nav class="app-nav" aria-label="主导航">
          <div class="app-nav-brand">
            <Icon name="ri:music-2-fill" :size="22" color="var(--primary)" />
            <span class="app-nav-brand-title">Music Desktop</span>
          </div>

          <div class="app-nav-section">浏览</div>
          <button
            v-for="item in browseItems"
            :key="item.key"
            type="button"
            class="app-nav-item"
            :class="{ active: active === item.key && !lyricOpen }"
            @click="goNav(item.key)"
          >
            <span class="nav-icon">
              <Icon :name="item.icon" :size="18" />
            </span>
            <span>{{ item.label }}</span>
          </button>

          <div class="app-nav-section">音乐库</div>
          <button
            v-for="item in libraryItems"
            :key="item.key"
            type="button"
            class="app-nav-item"
            :class="{ active: active === item.key && !lyricOpen }"
            @click="goNav(item.key)"
          >
            <span class="nav-icon">
              <Icon :name="item.icon" :size="18" />
            </span>
            <span>{{ item.label }}</span>
            <span
              v-if="item.key === 'download' && downloadStore.activeCount"
              class="app-nav-badge"
            >
              {{ downloadStore.activeCount }}
            </span>
            <span
              v-else-if="item.key === 'queue' && player.queue.length"
              class="app-nav-badge"
              style="background: var(--surface-2); color: var(--text-muted)"
            >
              {{ player.queue.length }}
            </span>
          </button>

          <div class="app-nav-spacer" />

          <div class="app-nav-section">系统</div>
          <button type="button" class="app-nav-item" @click="openSettings">
            <span class="nav-icon">
              <Icon name="ri:settings-3-line" :size="18" />
            </span>
            <span>设置</span>
          </button>
        </nav>

        <main class="app-main">
          <!-- 专辑为独立路由；SearchPanel 始终 v-show 挂载，返回不丢搜索结果 -->
          <AlbumPanel v-if="isAlbumRoute" />
          <ChartsPanel v-show="!isAlbumRoute && active === 'charts'" />
          <SearchPanel v-show="!isAlbumRoute && active === 'search'" />
          <QueuePanel v-show="!isAlbumRoute && active === 'queue'" />
          <DownloadPanel v-show="!isAlbumRoute && active === 'download'" />
        </main>
      </div>

      <!-- 沉浸歌词全屏时隐藏主播放条，控件改在歌词页内 -->
      <PlayerBar v-show="!lyricOpen" />
      <ImmersiveLyric />
      <DownloadModal v-model:show="downloadShow" :track="downloadTrack" />
      <UpdateDialog />
      <div v-if="player.error" class="toast-error">
        {{ player.error }}
      </div>
    </div>
  </NMessageProvider>
</template>

<style scoped>
.app-nav-spacer {
  flex: 1;
  min-height: 8px;
}

.toast-error {
  position: absolute;
  bottom: calc(var(--player-height) + 16px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 50;
  background: rgba(232, 17, 35, 0.94);
  color: #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  max-width: min(480px, 80vw);
}
</style>
