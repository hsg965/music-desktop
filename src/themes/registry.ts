import type { SkinDefinition, SkinId } from "./types";

export const DEFAULT_SKIN_ID: SkinId = "obsidian";

/** 旧皮肤 id → 新 id（兼容 localStorage） */
const LEGACY_SKIN_MAP: Record<string, SkinId> = {
  "midnight-violet": "obsidian",
  "cyber-neon": "cobalt",
  "vinyl-night": "paper",
  "glass-ocean": "cobalt",
  "paper-light": "paper",
  "macaron-soft": "porcelain",
  "sakura-mist": "porcelain",
  "sky-breeze": "porcelain",
  "lemon-cream": "paper",
  "mint-fresh": "porcelain",
  "lavender-cloud": "porcelain",
  "nordic-snow": "porcelain",
  "peach-sunset": "cinnabar",
  "matcha-latte": "paper",
};

function darkTokens(partial: Partial<SkinDefinition["tokens"]> & Pick<
  SkinDefinition["tokens"],
  "bg" | "sider-bg" | "bar-bg" | "primary" | "primary-hover" | "primary-pressed" | "primary-soft" | "accent-secondary"
>): SkinDefinition["tokens"] {
  return {
    "bg-grad": partial.bg,
    surface: "rgba(255,255,255,0.04)",
    "surface-2": "rgba(255,255,255,0.07)",
    text: "rgba(255,255,255,0.92)",
    "text-muted": "rgba(255,255,255,0.58)",
    "text-faint": "rgba(255,255,255,0.36)",
    border: "rgba(255,255,255,0.08)",
    "border-strong": "rgba(255,255,255,0.14)",
    "radius-sm": "6px",
    "radius-md": "8px",
    "radius-lg": "12px",
    shadow: "0 8px 24px rgba(0,0,0,0.35)",
    glow: "none",
    "player-height": "76px",
    "sider-width": "204px",
    "cover-radius": "6px",
    "panel-blur": "0px",
    "noise-opacity": "0",
    "grid-opacity": "0",
    ...partial,
  };
}

function lightTokens(partial: Partial<SkinDefinition["tokens"]> & Pick<
  SkinDefinition["tokens"],
  "bg" | "sider-bg" | "bar-bg" | "primary" | "primary-hover" | "primary-pressed" | "primary-soft" | "accent-secondary"
>): SkinDefinition["tokens"] {
  return {
    "bg-grad": partial.bg,
    surface: "rgba(0,0,0,0.03)",
    "surface-2": "rgba(0,0,0,0.05)",
    text: "rgba(20,22,26,0.92)",
    "text-muted": "rgba(20,22,26,0.58)",
    "text-faint": "rgba(20,22,26,0.38)",
    border: "rgba(20,22,26,0.08)",
    "border-strong": "rgba(20,22,26,0.14)",
    "radius-sm": "6px",
    "radius-md": "8px",
    "radius-lg": "12px",
    shadow: "0 6px 18px rgba(20,30,40,0.08)",
    glow: "none",
    "player-height": "76px",
    "sider-width": "204px",
    "cover-radius": "6px",
    "panel-blur": "0px",
    "noise-opacity": "0",
    "grid-opacity": "0",
    ...partial,
  };
}

export const SKINS: SkinDefinition[] = [
  {
    id: "obsidian",
    name: "黑曜石",
    description: "深空黑底，青绿强调 · 主流播放器风格",
    mode: "dark",
    layout: "desktop",
    preview: ["#121212", "#1db954", "#282828"],
    tokens: darkTokens({
      bg: "#121212",
      "sider-bg": "#000000",
      "bar-bg": "#181818",
      primary: "#1db954",
      "primary-hover": "#1ed760",
      "primary-pressed": "#169c46",
      "primary-soft": "rgba(29,185,84,0.16)",
      "accent-secondary": "#1ed760",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#1db954",
        primaryColorHover: "#1ed760",
        primaryColorPressed: "#169c46",
        primaryColorSuppl: "#1db954",
        bodyColor: "#121212",
        cardColor: "#181818",
        modalColor: "#181818",
        popoverColor: "#242424",
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: "8px",
      },
    },
  },
  {
    id: "cinnabar",
    name: "朱砂",
    description: "暗夜红调 · 热门曲库气质",
    mode: "dark",
    layout: "desktop",
    preview: ["#141414", "#ec4141", "#2a1a1a"],
    tokens: darkTokens({
      bg: "#141414",
      "sider-bg": "#0c0c0c",
      "bar-bg": "#1a1a1a",
      primary: "#ec4141",
      "primary-hover": "#ff5a5a",
      "primary-pressed": "#c93434",
      "primary-soft": "rgba(236,65,65,0.16)",
      "accent-secondary": "#ff7a7a",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#ec4141",
        primaryColorHover: "#ff5a5a",
        primaryColorPressed: "#c93434",
        primaryColorSuppl: "#ec4141",
        bodyColor: "#141414",
        cardColor: "#1a1a1a",
        modalColor: "#1a1a1a",
        popoverColor: "#242424",
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: "8px",
      },
    },
  },
  {
    id: "cobalt",
    name: "钴蓝",
    description: "冷静蓝调 · 专注聆听",
    mode: "dark",
    layout: "desktop",
    preview: ["#0f1419", "#3d8bfd", "#1a2330"],
    tokens: darkTokens({
      bg: "#0f1419",
      "sider-bg": "#0a0e13",
      "bar-bg": "#151b24",
      primary: "#3d8bfd",
      "primary-hover": "#5ca0ff",
      "primary-pressed": "#2f74d8",
      "primary-soft": "rgba(61,139,253,0.16)",
      "accent-secondary": "#7eb6ff",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#3d8bfd",
        primaryColorHover: "#5ca0ff",
        primaryColorPressed: "#2f74d8",
        primaryColorSuppl: "#3d8bfd",
        bodyColor: "#0f1419",
        cardColor: "#151b24",
        modalColor: "#151b24",
        popoverColor: "#1c2430",
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: "8px",
      },
    },
  },
  {
    id: "slate",
    name: "岩灰",
    description: "中性灰阶 · 低调专业",
    mode: "dark",
    layout: "desktop",
    preview: ["#1c1e22", "#a8b0bc", "#2a2d33"],
    tokens: darkTokens({
      bg: "#1c1e22",
      "sider-bg": "#16181c",
      "bar-bg": "#22252b",
      primary: "#a8b0bc",
      "primary-hover": "#c0c7d0",
      "primary-pressed": "#8b93a0",
      "primary-soft": "rgba(168,176,188,0.14)",
      "accent-secondary": "#d0d6de",
      text: "rgba(240,242,245,0.92)",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#a8b0bc",
        primaryColorHover: "#c0c7d0",
        primaryColorPressed: "#8b93a0",
        primaryColorSuppl: "#a8b0bc",
        bodyColor: "#1c1e22",
        cardColor: "#22252b",
        modalColor: "#22252b",
        popoverColor: "#2a2d33",
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: "8px",
      },
    },
  },
  {
    id: "porcelain",
    name: "瓷白",
    description: "干净浅色 · 日间办公",
    mode: "light",
    layout: "desktop",
    preview: ["#f5f6f8", "#2563eb", "#ffffff"],
    tokens: lightTokens({
      bg: "#f5f6f8",
      "sider-bg": "#ffffff",
      "bar-bg": "#ffffff",
      primary: "#2563eb",
      "primary-hover": "#3b82f6",
      "primary-pressed": "#1d4ed8",
      "primary-soft": "rgba(37,99,235,0.1)",
      "accent-secondary": "#60a5fa",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#2563eb",
        primaryColorHover: "#3b82f6",
        primaryColorPressed: "#1d4ed8",
        primaryColorSuppl: "#2563eb",
        bodyColor: "#f5f6f8",
        cardColor: "#ffffff",
        modalColor: "#ffffff",
        popoverColor: "#ffffff",
        borderColor: "rgba(20,22,26,0.08)",
        borderRadius: "8px",
      },
    },
  },
  {
    id: "paper",
    name: "宣纸",
    description: "暖白纸感 · 柔和阅读",
    mode: "light",
    layout: "desktop",
    preview: ["#f3f0ea", "#b45309", "#fffcf7"],
    tokens: lightTokens({
      bg: "#f3f0ea",
      "sider-bg": "#fffcf7",
      "bar-bg": "#fffcf7",
      primary: "#b45309",
      "primary-hover": "#c86614",
      "primary-pressed": "#92400e",
      "primary-soft": "rgba(180,83,9,0.1)",
      "accent-secondary": "#d97706",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#b45309",
        primaryColorHover: "#c86614",
        primaryColorPressed: "#92400e",
        primaryColorSuppl: "#b45309",
        bodyColor: "#f3f0ea",
        cardColor: "#fffcf7",
        modalColor: "#fffcf7",
        popoverColor: "#ffffff",
        borderColor: "rgba(40,32,20,0.1)",
        borderRadius: "8px",
      },
    },
  },
];

export function resolveSkinId(id?: string | null): SkinId {
  if (!id) return DEFAULT_SKIN_ID;
  if (SKINS.some((s) => s.id === id)) return id as SkinId;
  return LEGACY_SKIN_MAP[id] ?? DEFAULT_SKIN_ID;
}

export function getSkin(id: SkinId | string): SkinDefinition {
  const resolved = resolveSkinId(id);
  return SKINS.find((s) => s.id === resolved) ?? SKINS[0];
}

export function applySkinToDocument(skin: SkinDefinition) {
  const root = document.documentElement;
  root.dataset.skin = skin.id;
  root.dataset.layout = "desktop";
  root.dataset.mode = skin.mode;
  root.dataset.wallpaper = skin.wallpaper.type;

  for (const [key, value] of Object.entries(skin.tokens)) {
    root.style.setProperty(`--${key}`, value);
  }

  root.style.setProperty("--bg", skin.tokens.bg);
  root.style.setProperty("--sider-bg", skin.tokens["sider-bg"]);
  root.style.setProperty("--bar-bg", skin.tokens["bar-bg"]);
  root.style.setProperty("--panel-blur", skin.tokens["panel-blur"]);
  root.style.setProperty("--glass-blur", skin.tokens["panel-blur"]);
  root.style.setProperty("--glass-bg", skin.tokens.surface);
  root.style.setProperty("--glass-bg-light", skin.tokens.surface);
  root.style.setProperty("--glass-border", skin.tokens.border);

  if (skin.wallpaper.type === "css") {
    root.style.setProperty("--wallpaper", skin.wallpaper.value);
    root.style.removeProperty("--wallpaper-image");
  } else {
    const fallback = skin.wallpaper.fallback ?? skin.tokens.bg;
    root.style.setProperty("--wallpaper", fallback);
    root.style.setProperty(
      "--wallpaper-image",
      `url("${skin.wallpaper.src}")`,
    );
  }

  if (skin.overlay) {
    root.style.setProperty("--wallpaper-overlay", skin.overlay);
  } else {
    root.style.setProperty("--wallpaper-overlay", "none");
  }

  root.style.colorScheme = skin.mode;
}
