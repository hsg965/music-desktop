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
import { getSkin, applySkin, resolveSkinId } from "./themes/apply";
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
      // 默认：深色字 + 可见底（亮色下白底）
      textColor: t.text,
      textColorHover: t.text,
      textColorPressed: t.text,
      textColorFocus: t.text,
      textColorDisabled: t["text-faint"],
      textColorText: t["text-muted"],
      textColorTextHover: t.primary,
      textColorGhost: t.primary,
      textColorGhostHover: t["primary-hover"],
      // 实心主按钮：白字 + 主色底（默认态就必须有底，不能靠 hover）
      textColorPrimary: "#ffffff",
      textColorHoverPrimary: "#ffffff",
      textColorPressedPrimary: "#ffffff",
      textColorFocusPrimary: "#ffffff",
      textColorDisabledPrimary: "rgba(255,255,255,0.55)",
      // secondary 主色按钮用主色当字色（naive 会取 colorPrimary 作 secondary 字色）
      // 所以 color 系列给实心底，opacity 由 naive secondary 分支处理
      color: isLight ? "#ffffff" : t["surface-2"],
      colorHover: isLight ? "#f3f4f6" : t["surface-2"],
      colorPressed: isLight ? "#e8e9ec" : t.surface,
      colorFocus: isLight ? "#f3f4f6" : t["surface-2"],
      colorDisabled: isLight ? "#ffffff" : t.surface,
      colorPrimary: t.primary,
      colorHoverPrimary: t["primary-hover"],
      colorPressedPrimary: t["primary-pressed"],
      colorFocusPrimary: t["primary-hover"],
      colorDisabledPrimary: t.primary,
      // secondary 浅底不透明度（亮色略高更易辨认）
      colorOpacitySecondary: isLight ? "0.14" : "0.18",
      colorOpacitySecondaryHover: isLight ? "0.2" : "0.26",
      colorOpacitySecondaryPressed: isLight ? "0.24" : "0.32",
      border: `1px solid ${t["border-strong"]}`,
      borderHover: `1px solid ${t["border-strong"]}`,
      borderPrimary: `1px solid ${t.primary}`,
      borderHoverPrimary: `1px solid ${t["primary-hover"]}`,
      borderFocusPrimary: `1px solid ${t["primary-hover"]}`,
    },
    Slider: {
      fillColor: t.primary,
      fillColorHover: t["primary-hover"],
      railColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)",
      railColorHover: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.18)",
      handleSize: "12px",
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
    if (data.skinId) {
      const next = resolveSkinId(data.skinId) as SkinId;
      if (next !== settings.skinId) {
        settings.skinId = next;
        applySkin(next);
      }
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
