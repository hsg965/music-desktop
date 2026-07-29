<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { NSelect, NSlider, NSwitch, NDivider, NButton } from "naive-ui";
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

const settings = useSettingsStore();
const player = usePlayerStore();

const rate = ref(getRateLimitStatus());
let rateTimer: number | null = null;

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

      <NDivider />
      <div class="text-xs leading-relaxed" style="color: var(--text-faint)">
        音源 API 来自 GD Studio（仅供学习，禁止商用，CC BY-NC 4.0）。
        <br />
        文档：https://music-api.gdstudio.xyz/api.php
      </div>
    </div>
  </div>
</template>
