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

  /** 表单控件底：半透明雾面，避免纯白块 */
  const ctrl = isLight
    ? t["surface-2"] || "rgba(255,255,255,0.4)"
    : "rgba(255,255,255,0.08)";
  const ctrlFocus = isLight
    ? "rgba(255,255,255,0.55)"
    : "rgba(255,255,255,0.12)";
  const ctrlBorder = `1px solid ${t.border}`;
  const ctrlBorderHover = `1px solid ${t["border-strong"]}`;
  const ctrlBorderFocus = `1px solid ${t.primary}`;
  /** 下拉/弹层：略实一点但仍跟皮肤，不用死白 */
  const pop = isLight
    ? t["bar-bg"] !== "transparent"
      ? t["bar-bg"]
      : "rgba(255,252,240,0.92)"
    : t["bar-bg"] || "rgba(28,28,32,0.92)";
  const btnFace = ctrl;
  const btnFaceHover = ctrlFocus;

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
      cardColor: ctrl,
      modalColor: pop,
      popoverColor: pop,
      borderColor: t.border,
      borderRadius: t["radius-md"],
      inputColor: ctrl,
      inputColorDisabled: t.surface,
      hoverColor: t["surface-2"],
    },
    Button: {
      borderRadiusMedium: t["radius-md"],
      textColor: t.text,
      textColorHover: t.text,
      textColorPressed: t.text,
      textColorFocus: t.text,
      textColorDisabled: t["text-faint"],
      textColorText: t["text-muted"],
      textColorTextHover: t.primary,
      textColorGhost: t.primary,
      textColorGhostHover: t["primary-hover"],
      textColorPrimary: "#ffffff",
      textColorHoverPrimary: "#ffffff",
      textColorPressedPrimary: "#ffffff",
      textColorFocusPrimary: "#ffffff",
      textColorDisabledPrimary: "rgba(255,255,255,0.55)",
      color: btnFace,
      colorHover: btnFaceHover,
      colorPressed: t.surface,
      colorFocus: btnFaceHover,
      colorDisabled: t.surface,
      colorPrimary: t.primary,
      colorHoverPrimary: t["primary-hover"],
      colorPressedPrimary: t["primary-pressed"],
      colorFocusPrimary: t["primary-hover"],
      colorDisabledPrimary: t.primary,
      colorOpacitySecondary: isLight ? "0.14" : "0.18",
      colorOpacitySecondaryHover: isLight ? "0.2" : "0.26",
      colorOpacitySecondaryPressed: isLight ? "0.24" : "0.32",
      border: ctrlBorderHover,
      borderHover: ctrlBorderHover,
      borderPrimary: `1px solid ${t.primary}`,
      borderHoverPrimary: `1px solid ${t["primary-hover"]}`,
      borderFocusPrimary: `1px solid ${t["primary-hover"]}`,
    },
    Input: {
      borderRadius: t["radius-md"],
      color: ctrl,
      colorFocus: ctrlFocus,
      colorDisabled: t.surface,
      textColor: t.text,
      textColorDisabled: t["text-faint"],
      placeholderColor: t["text-faint"],
      caretColor: t.primary,
      border: ctrlBorder,
      borderHover: ctrlBorderHover,
      borderFocus: ctrlBorderFocus,
      borderDisabled: ctrlBorder,
      boxShadowFocus: `0 0 0 2px ${t["primary-soft"]}`,
    },
    InternalSelection: {
      borderRadius: t["radius-md"],
      color: ctrl,
      colorActive: ctrlFocus,
      colorDisabled: t.surface,
      textColor: t.text,
      textColorDisabled: t["text-faint"],
      placeholderColor: t["text-faint"],
      border: ctrlBorder,
      borderHover: ctrlBorderHover,
      borderActive: ctrlBorderFocus,
      borderFocus: ctrlBorderFocus,
      borderDisabled: ctrlBorder,
      caretColor: t.primary,
      arrowColor: t["text-muted"],
      boxShadowHover: "none",
      boxShadowActive: `0 0 0 2px ${t["primary-soft"]}`,
      boxShadowFocus: `0 0 0 2px ${t["primary-soft"]}`,
    },
    InternalSelectMenu: {
      borderRadius: t["radius-md"],
      color: pop,
      optionTextColor: t.text,
      optionTextColorActive: t.primary,
      optionTextColorPressed: t.primary,
      optionColorPending: t["surface-2"],
      optionColorActive: t["primary-soft"],
      optionColorActivePending: t["primary-soft"],
    },
    Slider: {
      fillColor: t.primary,
      fillColorHover: t["primary-hover"],
      railColor: isLight ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.12)",
      railColorHover: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.18)",
      handleSize: "12px",
      handleColor: "#ffffff",
    },
    Switch: {
      railColor: isLight ? "rgba(0,0,0,0.14)" : "rgba(255,255,255,0.16)",
      railColorActive: t.primary,
      buttonColor: "#ffffff",
    },
    Radio: {
      textColor: t.text,
      dotColorActive: t.primary,
      boxShadowActive: `inset 0 0 0 1px ${t.primary}`,
      buttonColorActive: t["primary-soft"],
      buttonTextColorActive: t.primary,
      buttonBorderColor: t.border,
      buttonBorderColorActive: t.primary,
      buttonBoxShadowFocus: `0 0 0 2px ${t["primary-soft"]}`,
    },
    ColorPicker: {
      borderRadius: t["radius-md"],
      border: ctrlBorder,
      borderHover: ctrlBorderHover,
      borderActive: ctrlBorderFocus,
      boxShadow: "none",
      boxShadowFocus: `0 0 0 2px ${t["primary-soft"]}`,
    },
    Card: {
      color: ctrl,
      colorModal: pop,
      colorEmbedded: t.surface,
      textColor: t.text,
      titleTextColor: t.text,
      borderColor: t.border,
      closeIconColor: t["text-muted"],
      closeIconColorHover: t.text,
      borderRadius: t["radius-md"],
    },
    Modal: {
      color: pop,
      textColor: t.text,
      borderRadius: t["radius-lg"],
    },
    Popover: {
      color: pop,
      textColor: t.text,
      borderRadius: t["radius-md"],
    },
    Dropdown: {
      color: pop,
      optionTextColor: t.text,
      optionTextColorHover: t.text,
      optionTextColorActive: t.primary,
      optionColorHover: t["surface-2"],
      optionColorActive: t["primary-soft"],
      borderRadius: t["radius-md"],
    },
    Tag: {
      borderRadius: t["radius-sm"],
      color: t["surface-2"],
      textColor: t.text,
      border: `1px solid ${t.border}`,
    },
    Spin: {
      color: t.primary,
    },
    Empty: {
      textColor: t["text-muted"],
      iconColor: t["text-faint"],
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
