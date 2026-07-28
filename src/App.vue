<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import {
  darkTheme,
  NConfigProvider,
  NGlobalStyle,
  type GlobalThemeOverrides,
} from "naive-ui";
import { RouterView } from "vue-router";

const route = useRoute();
/** 透明悬浮窗：不注入 Naive 全局深色 body 背景 */
const isOverlayWin = computed(
  () => route.name === "lyric" || route.name === "mini",
);

const themeOverrides = computed<GlobalThemeOverrides>(() => ({
  common: {
    primaryColor: "#7c6af7",
    primaryColorHover: "#9080ff",
    primaryColorPressed: "#6a58e0",
    primaryColorSuppl: "#7c6af7",
    bodyColor: isOverlayWin.value ? "transparent" : "#121218",
    cardColor: "#1a1a22",
    modalColor: "#1a1a22",
    popoverColor: "#1e1e28",
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: "8px",
  },
  Button: {
    borderRadiusMedium: "8px",
  },
  Menu: {
    itemTextColor: "rgba(255,255,255,0.65)",
    itemTextColorHover: "#fff",
    itemTextColorActive: "#c4bbff",
    itemTextColorActiveHover: "#c4bbff",
    itemIconColor: "rgba(255,255,255,0.55)",
    itemIconColorHover: "#fff",
    itemIconColorActive: "#c4bbff",
    itemColorActive: "rgba(124,106,247,0.15)",
    itemColorActiveHover: "rgba(124,106,247,0.2)",
  },
  Slider: {
    fillColor: "#7c6af7",
    fillColorHover: "#9080ff",
  },
}));
</script>

<template>
  <NConfigProvider :theme="darkTheme" :theme-overrides="themeOverrides">
    <NGlobalStyle v-if="!isOverlayWin" />
    <RouterView />
  </NConfigProvider>
</template>
