<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute } from "vue-router";
import {
  darkTheme,
  lightTheme,
  NConfigProvider,
  NGlobalStyle,
  type GlobalThemeOverrides,
} from "naive-ui";
import { RouterView } from "vue-router";
import { useSettingsStore } from "./stores/settings";
import { getSkin, applySkin } from "./themes/apply";
import type { SkinId } from "./themes/types";

const route = useRoute();
const settings = useSettingsStore();

const isOverlayWin = computed(
  () =>
    route.name === "lyric" ||
    route.name === "mini",
  // theme 窗口需要正常背景，不作为透明浮层
);

const skin = computed(() => getSkin(settings.skinId));

const naiveTheme = computed(() =>
  skin.value.mode === "light" ? lightTheme : darkTheme,
);

const themeOverrides = computed<GlobalThemeOverrides>(() => {
  const t = skin.value.tokens;
  const base = skin.value.naiveOverrides;
  const isLight = skin.value.mode === "light";

  return {
    common: {
      ...base.common,
      bodyColor: isOverlayWin.value
        ? "transparent"
        : (base.common?.bodyColor as string) || t.bg,
      primaryColor: t.primary,
      primaryColorHover: t["primary-hover"],
      primaryColorPressed: t["primary-pressed"],
      primaryColorSuppl: t.primary,
      textColorBase: t.text,
    },
    Button: {
      borderRadiusMedium: t["radius-md"],
      // 默认/主按钮：字色=主题色（与描边一致），悬停实心白字
      textColor: t.primary,
      textColorHover: "#ffffff",
      textColorPressed: "#ffffff",
      textColorFocus: t.primary,
      textColorText: t.primary,
      textColorTextHover: t["primary-hover"],
      textColorGhost: t.primary,
      textColorGhostHover: t["primary-hover"],
      textColorPrimary: t.primary,
      textColorHoverPrimary: "#ffffff",
      textColorPressedPrimary: "#ffffff",
      textColorFocusPrimary: t.primary,
      color: "transparent",
      colorHover: t.primary,
      colorPressed: t["primary-pressed"],
      colorPrimary: "transparent",
      colorHoverPrimary: t.primary,
      colorPressedPrimary: t["primary-pressed"],
      border: `1px solid ${t.primary}`,
      borderHover: `1px solid ${t.primary}`,
      borderPrimary: `1px solid ${t.primary}`,
      borderHoverPrimary: `1px solid ${t.primary}`,
    },
    Menu: {
      itemTextColor: t["text-muted"],
      itemTextColorHover: t.text,
      itemTextColorActive: t.primary,
      itemTextColorActiveHover: t.primary,
      itemIconColor: t["text-muted"],
      itemIconColorHover: t.text,
      itemIconColorActive: t.primary,
      itemColorActive: t["primary-soft"],
      itemColorActiveHover: t["primary-soft"],
      itemColorHover: isLight ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
    },
    Slider: {
      fillColor: t.primary,
      fillColorHover: t["primary-hover"],
    },
    Card: {
      color: t["surface-2"] || t["bar-bg"],
      colorModal: isLight ? "#ffffff" : t["bar-bg"],
      colorEmbedded: t.surface,
      textColor: t.text,
      titleTextColor: t.text,
      borderColor: t.border,
      closeIconColor: t["text-muted"],
      closeIconColorHover: t.text,
    },
    Modal: {
      color: isLight ? "#ffffff" : t["bar-bg"],
      textColor: t.text,
    },
    Radio: {
      textColor: t.text,
      dotColorActive: t.primary,
      boxShadowActive: `inset 0 0 0 1px ${t.primary}`,
    },
  };
});

watch(
  () => settings.skinId,
  (id) => {
    applySkin(id);
  },
);

/** 主题独立窗口改肤后，主窗通过 storage 同步 */
function onStorage(e: StorageEvent) {
  if (e.key !== "music-desktop-settings" || !e.newValue) return;
  try {
    const data = JSON.parse(e.newValue) as {
      skinId?: string;
      lyricLookAhead?: number;
    };
    if (data.skinId && data.skinId !== settings.skinId) {
      settings.skinId = data.skinId as SkinId;
      applySkin(data.skinId);
    }
    if (
      typeof data.lyricLookAhead === "number" &&
      data.lyricLookAhead !== settings.lyricLookAhead
    ) {
      settings.lyricLookAhead = data.lyricLookAhead;
    }
  } catch {
    // ignore
  }
}

onMounted(() => {
  window.addEventListener("storage", onStorage);
});
onUnmounted(() => {
  window.removeEventListener("storage", onStorage);
});
</script>

<template>
  <NConfigProvider :theme="naiveTheme" :theme-overrides="themeOverrides">
    <NGlobalStyle v-if="!isOverlayWin" />
    <RouterView />
  </NConfigProvider>
</template>
