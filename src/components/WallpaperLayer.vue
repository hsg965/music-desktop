<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { activeSkin } from "../themes/activeSkin";
import { getSkin, DEFAULT_SKIN_ID } from "../themes/apply";

const videoEl = ref<HTMLVideoElement | null>(null);
const ready = ref(false);
const failed = ref(false);

/** 无 pinia 的窗口也可用 activeSkin；首帧前用 registry 兜底 */
const skin = computed(() => {
  if (activeSkin.value) return activeSkin.value;
  try {
    const raw = localStorage.getItem("music-desktop-settings");
    const id = raw ? (JSON.parse(raw).skinId as string) : DEFAULT_SKIN_ID;
    return getSkin(id || DEFAULT_SKIN_ID);
  } catch {
    return getSkin(DEFAULT_SKIN_ID);
  }
});

const isVideo = computed(() => skin.value.wallpaper.type === "video");

const videoSrc = computed(() =>
  skin.value.wallpaper.type === "video" ? skin.value.wallpaper.src : "",
);

const poster = computed(() => {
  const w = skin.value.wallpaper;
  if (w.type === "video") return w.poster || "";
  return "";
});

async function playSafe() {
  const el = videoEl.value;
  if (!el || !isVideo.value) return;
  try {
    el.muted = true;
    await el.play();
  } catch {
    // 自动播放策略 / 后台标签：忽略，visibility 时再试
  }
}

function onCanPlay() {
  ready.value = true;
  failed.value = false;
  void playSafe();
}

function onError() {
  failed.value = true;
  ready.value = false;
}

function onVisibility() {
  if (document.hidden) {
    videoEl.value?.pause();
  } else {
    void playSafe();
  }
}

watch(videoSrc, () => {
  ready.value = false;
  failed.value = false;
});

watch(
  [isVideo, videoSrc],
  async () => {
    if (!isVideo.value) return;
    await playSafe();
  },
  { flush: "post" },
);

onMounted(() => {
  document.addEventListener("visibilitychange", onVisibility);
  void playSafe();
});

onUnmounted(() => {
  document.removeEventListener("visibilitychange", onVisibility);
  videoEl.value?.pause();
});
</script>

<template>
  <div
    class="skin-wallpaper"
    :class="{ 'is-video': isVideo, ready, failed }"
    aria-hidden="true"
  >
    <video
      v-if="isVideo && videoSrc && !failed"
      ref="videoEl"
      class="skin-wallpaper-video"
      :src="videoSrc"
      :poster="poster || undefined"
      muted
      loop
      playsinline
      autoplay
      preload="auto"
      disablepictureinpicture
      @canplay="onCanPlay"
      @error="onError"
    />
  </div>
</template>

<style scoped>
.skin-wallpaper {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.skin-wallpaper-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  /* 未就绪时略透明，露出 CSS poster/fallback，避免黑闪 */
  opacity: 0;
  transition: opacity 0.35s ease;
}

.skin-wallpaper.ready .skin-wallpaper-video {
  opacity: 1;
}
</style>
