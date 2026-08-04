<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  NSelect,
  NSlider,
  NSwitch,
  NButton,
  NColorPicker,
  NRadioGroup,
  NRadio,
  NMessageProvider,
} from "naive-ui";
import { BITRATE_OPTIONS, MUSIC_SOURCES, getRateLimitStatus } from "../api/music";
import {
  DEFAULT_LYRIC_LOOKAHEAD,
  useSettingsStore,
} from "../stores/settings";
import { usePlayerStore } from "../stores/player";
import {
  openDesktopLyric,
  openMiniPlayer,
  openThemePicker,
  closeWindowByLabel,
} from "../utils/windows";
import { useUpdater } from "../composables/useUpdater";
import { clearAudioCache, getAudioCacheStats } from "../utils/audioCache";
import { applySkin, getSkin } from "../themes/apply";
import Icon from "../components/Icon.vue";
import WallpaperLayer from "../components/WallpaperLayer.vue";
import UpdateDialog from "../components/UpdateDialog.vue";

type SectionId =
  | "appearance"
  | "playback"
  | "lyric"
  | "desktop"
  | "storage"
  | "about";

const sections: { id: SectionId; label: string }[] = [
  { id: "appearance", label: "外观" },
  { id: "playback", label: "播放" },
  { id: "lyric", label: "歌词" },
  { id: "desktop", label: "桌面" },
  { id: "storage", label: "存储" },
  { id: "about", label: "关于" },
];

const section = ref<SectionId>("appearance");
const settings = useSettingsStore();
const player = usePlayerStore();
const {
  currentVersion,
  phase,
  isBusy,
  loadCurrentVersion,
  checkForUpdate,
  openGitHubReleases,
} = useUpdater();

const rate = ref(getRateLimitStatus());
let rateTimer: number | null = null;
const cachePath = ref("");
const cacheFileCount = ref(0);
const cacheTotalBytes = ref(0);
const cacheBusy = ref(false);
const toast = ref("");

const skinName = computed(() => getSkin(settings.skinId).name);
const skinMode = computed(() =>
  getSkin(settings.skinId).mode === "light" ? "浅色" : "深色",
);
const sectionTitle = computed(
  () => sections.find((s) => s.id === section.value)?.label ?? "设置",
);

const lookAheadValue = computed(() => {
  const v = settings.lyricLookAhead;
  return typeof v === "number" && Number.isFinite(v) ? v : DEFAULT_LYRIC_LOOKAHEAD;
});
const lookAheadLabel = computed(() => lookAheadValue.value.toFixed(2));
const quotaPct = computed(() =>
  Math.min(100, Math.round((rate.value.used / Math.max(1, rate.value.max)) * 100)),
);

const sourceOptions = MUSIC_SOURCES.map((s) => ({ label: s.label, value: s.value }));
const brOptions = BITRATE_OPTIONS.map((b) => ({ label: b.label, value: b.value }));

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function flash(msg: string) {
  toast.value = msg;
  window.setTimeout(() => {
    if (toast.value === msg) toast.value = "";
  }, 2200);
}

async function refreshCacheStats() {
  const stats = await getAudioCacheStats();
  if (!stats) {
    cachePath.value = "";
    cacheFileCount.value = 0;
    cacheTotalBytes.value = 0;
    return;
  }
  cachePath.value = stats.path;
  cacheFileCount.value = stats.fileCount;
  cacheTotalBytes.value = stats.totalBytes;
}

async function onClearCache() {
  cacheBusy.value = true;
  try {
    const n = await clearAudioCache();
    await refreshCacheStats();
    flash(n > 0 ? `已清除 ${n} 个缓存文件` : "缓存目录为空");
  } catch {
    flash("清除缓存失败");
  } finally {
    cacheBusy.value = false;
  }
}

async function onDesktopLyric(v: boolean) {
  settings.desktopLyric = v;
  if (v) await openDesktopLyric();
  else await closeWindowByLabel("lyric");
}

async function onMiniPlayer(v: boolean) {
  settings.miniPlayer = v;
  if (v) await openMiniPlayer();
  else await closeWindowByLabel("mini");
}

function onVolume(v: number) {
  player.setVolume(v);
}

async function closeWin() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    // ignore
  }
}

onMounted(() => {
  applySkin(settings.skinId);
  try {
    if (typeof settings.lyricLookAhead !== "number") {
      settings.setLyricLookAhead?.(DEFAULT_LYRIC_LOOKAHEAD);
    }
  } catch {
    // ignore
  }
  void loadCurrentVersion();
  void refreshCacheStats();
  rateTimer = window.setInterval(() => {
    rate.value = getRateLimitStatus();
  }, 2000);
});

onUnmounted(() => {
  if (rateTimer != null) window.clearInterval(rateTimer);
});
</script>

<template>
  <NMessageProvider>
    <div class="settings-win app-shell">
      <WallpaperLayer />
      <header class="titlebar skin-title-seamless" data-tauri-drag-region>
        <div class="titlebar-left" data-tauri-drag-region>
          <Icon name="ri:settings-3-fill" :size="16" color="var(--primary)" />
          <span data-tauri-drag-region>设置</span>
        </div>
        <button type="button" class="win-close" title="关闭" @click="closeWin">
          <Icon name="ri:close-line" :size="16" />
        </button>
      </header>

      <div class="body">
        <nav class="side">
          <button
            v-for="s in sections"
            :key="s.id"
            type="button"
            class="side-item"
            :class="{ active: section === s.id }"
            @click="section = s.id"
          >
            {{ s.label }}
          </button>
        </nav>

        <div class="content">
          <h1 class="page-title">{{ sectionTitle }}</h1>
          <div class="page-scroll">
            <!-- 外观 -->
            <template v-if="section === 'appearance'">
              <div class="form">
                <div class="row">
                  <div class="label">
                    <div class="label-main">主题皮肤</div>
                    <div class="label-sub">{{ skinName }} · {{ skinMode }}</div>
                  </div>
                  <div class="control">
                    <NButton type="primary" size="small" @click="openThemePicker()">
                      更换主题
                    </NButton>
                  </div>
                </div>
                <p class="hint">更换整窗皮肤：壁纸、磨砂侧栏与播放条一并切换，布局不变。</p>
              </div>
            </template>

            <!-- 播放 -->
            <template v-else-if="section === 'playback'">
              <div class="form">
                <div class="row">
                  <div class="label">
                    <div class="label-main">默认音源</div>
                  </div>
                  <div class="control grow">
                    <NSelect
                      v-model:value="settings.source"
                      :options="sourceOptions"
                      size="small"
                    />
                  </div>
                </div>
                <div class="sep" />
                <div class="row">
                  <div class="label">
                    <div class="label-main">音质</div>
                  </div>
                  <div class="control grow">
                    <NSelect
                      v-model:value="settings.bitrate"
                      :options="brOptions"
                      size="small"
                    />
                  </div>
                </div>
                <div class="sep" />
                <div class="row block">
                  <div class="label">
                    <div class="label-main">
                      默认音量
                      <span class="val">{{ Math.round(settings.volume * 100) }}%</span>
                    </div>
                  </div>
                  <div class="control full">
                    <NSlider
                      :value="settings.volume"
                      :min="0"
                      :max="1"
                      :step="0.01"
                      @update:value="onVolume"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- 歌词 -->
            <template v-else-if="section === 'lyric'">
              <div class="form">
                <div class="row block">
                  <div class="label">
                    <div class="label-main">
                      提前量
                      <span class="val">{{ lookAheadLabel }} 秒</span>
                    </div>
                    <div class="label-sub">
                      越大越早切句；0 为严格按时间戳。影响沉浸歌词与桌面歌词。
                    </div>
                  </div>
                  <div class="control full">
                    <NSlider
                      :value="lookAheadValue"
                      :min="0"
                      :max="2"
                      :step="0.05"
                      @update:value="settings.setLyricLookAhead"
                    />
                  </div>
                </div>
                <div class="sep" />
                <div class="row block">
                  <div class="label">
                    <div class="label-main">桌面歌词颜色</div>
                  </div>
                  <div class="control full">
                    <NRadioGroup
                      :value="settings.desktopLyricColorMode"
                      name="desktop-lyric-color-mode"
                      @update:value="settings.setDesktopLyricColorMode"
                    >
                      <NRadio value="theme">跟随主题</NRadio>
                      <NRadio value="custom">自定义</NRadio>
                    </NRadioGroup>
                    <div
                      v-if="settings.desktopLyricColorMode === 'custom'"
                      class="inline-gap color-row"
                    >
                      <NColorPicker
                        class="lyric-color-picker"
                        :value="settings.desktopLyricColor"
                        :show-alpha="false"
                        :modes="['hex']"
                        size="small"
                        :show-preview="true"
                        @update:value="settings.setDesktopLyricColor"
                      />
                      <code class="hex">{{ settings.desktopLyricColor }}</code>
                    </div>
                  </div>
                </div>
                <div class="sep" />
                <div class="row block">
                  <div class="label">
                    <div class="label-main">
                      桌面歌词字号
                      <span class="val">{{ settings.desktopLyricFontSize }} px</span>
                    </div>
                  </div>
                  <div class="control full">
                    <NSlider
                      :value="settings.desktopLyricFontSize"
                      :min="14"
                      :max="56"
                      :step="1"
                      @update:value="settings.setDesktopLyricFontSize"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- 桌面 -->
            <template v-else-if="section === 'desktop'">
              <div class="form">
                <div class="row">
                  <div class="label">
                    <div class="label-main">关闭到托盘</div>
                    <div class="label-sub">关闭主窗口不退出进程</div>
                  </div>
                  <div class="control">
                    <NSwitch v-model:value="settings.closeToTray" />
                  </div>
                </div>
                <div class="sep" />
                <div class="row">
                  <div class="label">
                    <div class="label-main">桌面歌词</div>
                    <div class="label-sub">置顶悬浮歌词窗口</div>
                  </div>
                  <div class="control">
                    <NSwitch
                      :value="settings.desktopLyric"
                      @update:value="onDesktopLyric"
                    />
                  </div>
                </div>
                <div class="sep" />
                <div class="row">
                  <div class="label">
                    <div class="label-main">迷你播放器</div>
                    <div class="label-sub">小窗控制播放</div>
                  </div>
                  <div class="control">
                    <NSwitch
                      :value="settings.miniPlayer"
                      @update:value="onMiniPlayer"
                    />
                  </div>
                </div>
              </div>
            </template>

            <!-- 存储 -->
            <template v-else-if="section === 'storage'">
              <div class="form">
                <div class="row block">
                  <div class="label">
                    <div class="label-main">音频缓存</div>
                    <div class="label-sub">
                      {{ cacheFileCount }} 首 · {{ formatBytes(cacheTotalBytes) }}
                    </div>
                    <div v-if="cachePath" class="path" :title="cachePath">
                      {{ cachePath }}
                    </div>
                    <div v-else class="label-sub">
                      安装目录 / cache_dir / audio
                    </div>
                  </div>
                  <div class="control full actions">
                    <NButton size="small" :loading="cacheBusy" @click="refreshCacheStats">
                      刷新
                    </NButton>
                    <NButton
                      size="small"
                      type="warning"
                      secondary
                      :loading="cacheBusy"
                      @click="onClearCache"
                    >
                      清空缓存
                    </NButton>
                  </div>
                </div>
                <div class="sep" />
                <div class="row block">
                  <div class="label">
                    <div class="label-main">接口配额</div>
                    <div class="label-sub">
                      近 5 分钟 {{ rate.used }} / {{ rate.max }}（剩余
                      {{ rate.remaining }}）
                    </div>
                  </div>
                  <div class="control full">
                    <div class="meter">
                      <div class="meter-fill" :style="{ width: quotaPct + '%' }" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 关于 -->
            <template v-else>
              <div class="form">
                <div class="row">
                  <div class="label">
                    <div class="label-main">Music Desktop</div>
                    <div class="label-sub">版本 {{ currentVersion || "…" }}</div>
                  </div>
                </div>
                <div class="sep" />
                <div class="row">
                  <div class="label">
                    <div class="label-main">软件更新</div>
                    <div class="label-sub">通过 GitHub Releases 检查安装</div>
                  </div>
                  <div class="control actions">
                    <NButton
                      type="primary"
                      size="small"
                      :loading="phase === 'checking' || isBusy"
                      @click="checkForUpdate(false)"
                    >
                      检查更新
                    </NButton>
                    <NButton size="small" quaternary @click="openGitHubReleases">
                      GitHub
                    </NButton>
                  </div>
                </div>
                <p class="hint">
                  音源 API 来自 GD Studio，仅供学习，禁止商用（CC BY-NC 4.0）。
                </p>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div v-if="toast" class="toast">{{ toast }}</div>
      <UpdateDialog />
    </div>
  </NMessageProvider>
</template>

<style scoped>
.settings-win {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: transparent;
  color: var(--text);
  overflow: hidden;
}

/* 标题栏：与壁纸一体 */
.titlebar {
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 12px;
  border-bottom: none;
  user-select: none;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.win-close {
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.win-close:hover {
  background: #e81123;
  color: #fff;
}

.body {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* 左侧分类：QQ 风透明列 + 圆角毛玻璃项 */
.side {
  width: 140px;
  flex-shrink: 0;
  padding: 10px 10px;
  border-right: none;
  overflow-y: auto;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.side-item {
  display: block;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.side-item:hover {
  color: var(--text);
  background: var(--surface-2);
  backdrop-filter: blur(calc(var(--panel-blur) * 0.6));
  -webkit-backdrop-filter: blur(calc(var(--panel-blur) * 0.6));
}

.side-item.active {
  color: var(--text);
  font-weight: 600;
  background: var(--sider-bg);
  border-color: color-mix(in srgb, var(--border) 50%, transparent);
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
  box-shadow: 0 2px 8px color-mix(in srgb, var(--bg) 8%, transparent);
}

/* 右侧内容：透明融入壁纸 */
.content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: transparent;
}

.page-title {
  margin: 0;
  padding: 16px 20px 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

.page-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 4px 20px 24px;
}

.form {
  max-width: 520px;
}

/* 标签在左、控件在右 —— 桌面属性页常见布局 */
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 40px;
  padding: 8px 0;
}

.row.block {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.label {
  width: 148px;
  flex-shrink: 0;
  min-width: 0;
}

.row.block .label {
  width: auto;
}

.label-main {
  font-size: 13px;
  color: var(--text);
  line-height: 1.4;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.label-sub {
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-faint);
}

.val {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--primary);
}

.control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.control.grow {
  flex: 1;
  min-width: 0;
}

.control.full {
  width: 100%;
  justify-content: flex-start;
}

.control.actions,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sep {
  height: 1px;
  background: var(--border);
  margin: 2px 0;
}

.hint {
  margin: 12px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text-faint);
}

.path {
  margin-top: 4px;
  font-size: 11px;
  color: var(--text-faint);
  word-break: break-all;
  line-height: 1.4;
}

.inline-gap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.color-row {
  width: 100%;
  min-width: 0;
}

/* 触发器固定宽度；弹出面板在 body 上由全局 CSS 固定 240px */
.color-row :deep(.lyric-color-picker),
.color-row :deep(.n-color-picker) {
  width: 148px !important;
  max-width: 148px !important;
  min-width: 148px !important;
  flex: 0 0 148px;
}

.hex {
  font-size: 12px;
  color: var(--text-muted);
  font-family: ui-monospace, Consolas, monospace;
  flex: 0 0 auto;
}

.meter {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: var(--surface-2);
  overflow: hidden;
}

html[data-mode="light"] .meter {
  background: rgba(0, 0, 0, 0.08);
}

.meter-fill {
  height: 100%;
  background: var(--primary);
  transition: width 0.2s ease;
}

.toast {
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  z-index: 20;
  pointer-events: none;
}

html[data-mode="light"] .toast {
  background: rgba(30, 32, 36, 0.88);
}
</style>
