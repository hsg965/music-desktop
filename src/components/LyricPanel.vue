<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { findLyricIndex, parseLrc } from "../utils/lrc";
import { usePlayerStore } from "../stores/player";
import { useSettingsStore } from "../stores/settings";

const player = usePlayerStore();
const settings = useSettingsStore();
const listRef = ref<HTMLElement | null>(null);

const lines = computed(() => parseLrc(player.lyricText));
const tlines = computed(() => parseLrc(player.tlyricText));
const lookAhead = computed(() => {
  const v = settings.lyricLookAhead;
  return typeof v === "number" && Number.isFinite(v) ? v : 0.9;
});

const activeIndex = computed(() =>
  findLyricIndex(lines.value, player.currentTime, lookAhead.value),
);

function tlyricAt(time: number) {
  const idx = findLyricIndex(tlines.value, time, lookAhead.value);
  return idx >= 0 ? tlines.value[idx]?.text : "";
}

watch(activeIndex, (idx) => {
  if (idx < 0 || !listRef.value) return;
  const el = listRef.value.querySelector(`[data-i="${idx}"]`) as HTMLElement | null;
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
});
</script>

<template>
  <div class="h-full flex flex-col p-4">
    <div class="text-sm mb-3" style="color: var(--text-muted)">歌词</div>
    <div
      ref="listRef"
      class="flex-1 min-h-0 overflow-y-auto skin-panel px-4 py-8"
    >
      <template v-if="lines.length">
        <div
          v-for="(line, i) in lines"
          :key="`${line.time}-${i}`"
          :data-i="i"
          class="lyric-line text-center py-2 transition-all duration-300"
          :class="i === activeIndex ? 'active' : ''"
        >
          <div>{{ line.text || " " }}</div>
          <div v-if="tlyricAt(line.time)" class="text-xs mt-1 opacity-60">
            {{ tlyricAt(line.time) }}
          </div>
        </div>
      </template>
      <div
        v-else
        class="h-full flex items-center justify-center text-sm"
        style="color: var(--text-faint)"
      >
        {{ player.currentTrack ? "暂无歌词" : "播放歌曲后显示歌词" }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.lyric-line {
  color: var(--text-faint);
  font-size: 14px;
  line-height: 1.5;
}
.lyric-line.active {
  color: var(--primary);
  font-size: 16px;
  font-weight: 600;
  transform: scale(1.02);
}
</style>
