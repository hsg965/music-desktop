<script setup lang="ts">
import { NSelect, NSlider, NSwitch, NDivider } from "naive-ui";
import { BITRATE_OPTIONS, MUSIC_SOURCES } from "../api/music";
import { useSettingsStore } from "../stores/settings";
import { usePlayerStore } from "../stores/player";
import { openDesktopLyric, openMiniPlayer, closeWindowByLabel } from "../utils/windows";

const settings = useSettingsStore();
const player = usePlayerStore();

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
</script>

<template>
  <div class="h-full overflow-auto p-4">
    <div class="max-w-md space-y-5">
      <div>
        <div class="text-sm text-white/70 mb-2">默认音源</div>
        <NSelect v-model:value="settings.source" :options="sourceOptions" />
        <div class="text-xs text-white/30 mt-1">部分音源可能暂不可用</div>
      </div>

      <div>
        <div class="text-sm text-white/70 mb-2">音质</div>
        <NSelect v-model:value="settings.bitrate" :options="brOptions" />
      </div>

      <div>
        <div class="text-sm text-white/70 mb-2">
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

      <NDivider title-placement="left">桌面能力</NDivider>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-white/80">关闭窗口到托盘</div>
          <div class="text-xs text-white/35 mt-0.5">不退出进程，托盘可唤回</div>
        </div>
        <NSwitch v-model:value="settings.closeToTray" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-white/80">桌面歌词</div>
          <div class="text-xs text-white/35 mt-0.5">置顶悬浮歌词窗口</div>
        </div>
        <NSwitch :value="settings.desktopLyric" @update:value="onDesktopLyric" />
      </div>

      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-white/80">迷你播放器</div>
          <div class="text-xs text-white/35 mt-0.5">小窗控制播放</div>
        </div>
        <NSwitch :value="settings.miniPlayer" @update:value="onMiniPlayer" />
      </div>

      <NDivider />
      <div class="text-xs text-white/30 leading-relaxed">
        音源 API 来自 GD Studio（仅供学习，禁止商用，CC BY-NC 4.0）。
        <br />
        文档：https://music-api.gdstudio.xyz/api.php
      </div>
    </div>
  </div>
</template>
