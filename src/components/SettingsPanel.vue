<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  NSelect,
  NSlider,
  NSwitch,
  NDivider,
  NButton,
  NColorPicker,
  NRadioGroup,
  NRadio,
  useMessage,
} from "naive-ui";
import { BITRATE_OPTIONS, MUSIC_SOURCES, getRateLimitStatus } from "../api/music";
import {
  DEFAULT_LYRIC_LOOKAHEAD,
  useSettingsStore,
  type DesktopLyricColorMode,
} from "../stores/settings";
import { usePlayerStore } from "../stores/player";
import {
  openDesktopLyric,
  openMiniPlayer,
  openThemePicker,
  closeWindowByLabel,
} from "../utils/windows";
import { useUpdater } from "../composables/useUpdater";
import {
  clearAudioCache,
  getAudioCacheStats,
} from "../utils/audioCache";

const settings = useSettingsStore();
const player = usePlayerStore();
const message = useMessage();
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

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
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
    message.success(n > 0 ? `已清除 ${n} 个缓存文件` : "缓存目录为空");
  } catch {
    message.error("清除缓存失败");
  } finally {
    cacheBusy.value = false;
  }
}

// 兼容热更新/旧缓存：避免 lyricLookAhead 为空导致整页崩溃
const lookAheadValue = computed(() => {
  const v = settings.lyricLookAhead;
  return typeof v === "number" && Number.isFinite(v) ? v : DEFAULT_LYRIC_LOOKAHEAD;
});
const lookAheadLabel = computed(() => lookAheadValue.value.toFixed(2));

onMounted(() => {
  // 热更新后旧 pinia 实例可能缺字段/方法，做兜底避免白屏
  try {
    if (typeof settings.lyricLookAhead !== "number") {
      if (typeof settings.setLyricLookAhead === "function") {
        settings.setLyricLookAhead(DEFAULT_LYRIC_LOOKAHEAD);
      }
    }
  } catch {
    // ignore
  }
  void loadCurrentVersion();
  void refreshCacheStats();
  rateTimer = window.setInterval(() => {
    rate.value = getRateLimitStatus();
  }, 1000);
});
onUnmounted(() => {
  if (rateTimer != null) window.clearInterval(rateTimer);
});

const sourceOptions = MUSIC_SOURCES.map((s) => ({
  label: s.label,
  value: s.value,
}));
const brOptions = BITRATE_OPTIONS.map((b) => ({
  label: b.label,
  value: b.value,
}));

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

function onLookAhead(v: number) {
  try {
    if (typeof settings.setLyricLookAhead === "function") {
      settings.setLyricLookAhead(v);
    } else {
      // 旧 store 实例兜底
      (settings as { lyricLookAhead: number }).lyricLookAhead = v;
    }
  } catch {
    // ignore
  }
}

function onLyricColorMode(v: DesktopLyricColorMode) {
  settings.setDesktopLyricColorMode(v);
}

function onLyricColor(v: string) {
  settings.setDesktopLyricColor(v);
}

function onLyricFontSize(v: number) {
  settings.setDesktopLyricFontSize(v);
}
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <div class="max-w-2xl space-y-5">
      <div>
        <div class="text-sm mb-3" style="color: var(--text-muted)">主题皮肤</div>
        <div class="flex flex-wrap items-center gap-3">
          <NButton type="primary" secondary @click="openThemePicker()">
            打开主题窗口
          </NButton>
          <span class="text-xs" style="color: var(--text-faint)">
            共多套皮肤可选，含丰富亮色主题；在独立窗口中预览切换更方便
          </span>
        </div>
      </div>

      <NDivider title-placement="left">接口配额</NDivider>
      <div class="max-w-md text-sm space-y-1" style="color: var(--text-muted)">
        <div>
          近 5 分钟已用
          <b style="color: var(--primary)">{{ rate.used }}</b>
          / {{ rate.max }} 次
          <span style="color: var(--text-faint)">（剩余 {{ rate.remaining }}）</span>
        </div>
        <div class="text-xs" style="color: var(--text-faint)">
          已启用：结果缓存、相同请求去重、播放复用已有链接。搜索/翻页/切歌会消耗配额。
        </div>
      </div>

      <NDivider title-placement="left">播放</NDivider>

      <div class="max-w-md space-y-5">
        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">默认音源</div>
          <NSelect v-model:value="settings.source" :options="sourceOptions" />
          <div class="text-xs mt-1" style="color: var(--text-faint)">
            部分音源可能暂不可用
          </div>
        </div>

        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">音质</div>
          <NSelect v-model:value="settings.bitrate" :options="brOptions" />
        </div>

        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">
            默认音量 {{ Math.round(settings.volume * 100) }}%
          </div>
          <NSlider
            :value="settings.volume"
            :min="0"
            :max="1"
            :step="0.01"
            @update:value="onVolume"
          />
        </div>
      </div>

      <NDivider title-placement="left">歌词</NDivider>

      <div class="max-w-md space-y-5">
        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">
            歌词提前量 {{ lookAheadLabel }} 秒
          </div>
          <NSlider
            :value="lookAheadValue"
            :min="0"
            :max="2"
            :step="0.05"
            @update:value="onLookAhead"
          />
          <div class="text-xs mt-2" style="color: var(--text-faint)">
            LRC 时间戳多为开唱点。数值越大，句子越早显示；0 为严格按时间戳切换。
            影响主界面歌词与桌面歌词。默认 0.9 秒。
          </div>
        </div>

        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">
            桌面歌词颜色
          </div>
          <NRadioGroup
            :value="settings.desktopLyricColorMode"
            name="desktop-lyric-color-mode"
            @update:value="onLyricColorMode"
          >
            <NRadio value="theme">跟随主题色</NRadio>
            <NRadio value="custom">自定义颜色</NRadio>
          </NRadioGroup>
          <div
            v-if="settings.desktopLyricColorMode === 'custom'"
            class="mt-3 flex items-center gap-3"
          >
            <NColorPicker
              :value="settings.desktopLyricColor"
              :show-alpha="false"
              :modes="['hex']"
              style="width: 200px"
              @update:value="onLyricColor"
            />
            <span class="text-xs" style="color: var(--text-faint)">
              {{ settings.desktopLyricColor }}
            </span>
          </div>
          <div class="text-xs mt-2" style="color: var(--text-faint)">
            未悬停时显示在桌面上；「跟随主题」使用当前皮肤主色并带描边，避免看不清。
          </div>
        </div>

        <div>
          <div class="text-sm mb-2" style="color: var(--text-muted)">
            桌面歌词字号 {{ settings.desktopLyricFontSize }} px
          </div>
          <NSlider
            :value="settings.desktopLyricFontSize"
            :min="14"
            :max="56"
            :step="1"
            @update:value="onLyricFontSize"
          />
          <div class="text-xs mt-2" style="color: var(--text-faint)">
            仅影响桌面歌词悬浮窗；主界面歌词字号不变。
          </div>
        </div>
      </div>

      <NDivider title-placement="left">桌面能力</NDivider>

      <div class="max-w-md space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm" style="color: var(--text)">关闭窗口到托盘</div>
            <div class="text-xs mt-0.5" style="color: var(--text-faint)">
              不退出进程，托盘可唤回
            </div>
          </div>
          <NSwitch v-model:value="settings.closeToTray" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm" style="color: var(--text)">桌面歌词</div>
            <div class="text-xs mt-0.5" style="color: var(--text-faint)">
              置顶悬浮歌词窗口
            </div>
          </div>
          <NSwitch :value="settings.desktopLyric" @update:value="onDesktopLyric" />
        </div>

        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm" style="color: var(--text)">迷你播放器</div>
            <div class="text-xs mt-0.5" style="color: var(--text-faint)">
              小窗控制播放
            </div>
          </div>
          <NSwitch :value="settings.miniPlayer" @update:value="onMiniPlayer" />
        </div>
      </div>

      <NDivider title-placement="left">本地缓存</NDivider>

      <div class="max-w-md space-y-3">
        <div class="text-sm space-y-1" style="color: var(--text-muted)">
          <div>
            已缓存
            <b style="color: var(--text)">{{ cacheFileCount }}</b>
            首 ·
            <b style="color: var(--text)">{{ formatBytes(cacheTotalBytes) }}</b>
          </div>
          <div
            v-if="cachePath"
            class="text-xs break-all"
            style="color: var(--text-faint)"
          >
            目录：{{ cachePath }}
          </div>
          <div v-else class="text-xs" style="color: var(--text-faint)">
            目录：安装目录/cache_dir/audio（仅桌面端）
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <NButton secondary :loading="cacheBusy" @click="refreshCacheStats">
            刷新
          </NButton>
          <NButton
            type="warning"
            secondary
            :loading="cacheBusy"
            @click="onClearCache"
          >
            清空音频缓存
          </NButton>
        </div>
        <div class="text-xs" style="color: var(--text-faint)">
          播放过的歌曲会自动下载到本地；再次播放同一音质时不再请求音频流。
        </div>
      </div>

      <NDivider title-placement="left">关于与更新</NDivider>

      <div class="max-w-md space-y-3">
        <div class="text-sm" style="color: var(--text-muted)">
          当前版本
          <b style="color: var(--text)">{{ currentVersion || "…" }}</b>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <NButton
            type="primary"
            secondary
            :loading="phase === 'checking' || isBusy"
            @click="checkForUpdate(false)"
          >
            检查更新
          </NButton>
          <NButton quaternary @click="openGitHubReleases">
            GitHub Releases
          </NButton>
        </div>
        <div class="text-xs" style="color: var(--text-faint)">
          通过 GitHub Releases 自动检查并安装更新；启动时也会在后台静默检查。
        </div>
      </div>

      <NDivider />
      <div class="text-xs leading-relaxed" style="color: var(--text-faint)">
        音源 API 来自 GD Studio（仅供学习，禁止商用，CC BY-NC 4.0）。
        <br />
        文档：https://music-api.gdstudio.xyz/api.php
      </div>
    </div>
  </div>
</template>
