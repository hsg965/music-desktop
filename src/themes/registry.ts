import type { SkinDefinition, SkinId } from "./types";
import { activeSkin } from "./activeSkin";

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
  // 已下架的图片/视频皮肤 → 回退到相近默认
  "moss-forest": "obsidian",
  "sage-mist": "porcelain",
  "cloud-tea": "paper",
  "lavender-haze": "porcelain",
  "aurora-flow": "misty-lake",
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
    "panel-blur": "22px",
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
    border: "rgba(20,22,26,0.07)",
    "border-strong": "rgba(20,22,26,0.12)",
    "radius-sm": "6px",
    "radius-md": "8px",
    "radius-lg": "12px",
    shadow: "0 6px 18px rgba(20,30,40,0.08)",
    glow: "none",
    "player-height": "76px",
    "sider-width": "204px",
    "cover-radius": "6px",
    "panel-blur": "22px",
    "noise-opacity": "0",
    "grid-opacity": "0",
    ...partial,
  };
}

export const SKINS: SkinDefinition[] = [
  {
    id: "obsidian",
    name: "黑曜石",
    description: "深空黑底青绿辉光 · 毛玻璃侧栏与播放条",
    mode: "dark",
    layout: "desktop",
    preview: ["#121212", "#1db954", "#282828"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(1200px 600px at 20% -10%, rgba(29,185,84,0.22), transparent 55%), radial-gradient(900px 500px at 100% 80%, rgba(30,80,60,0.35), transparent 50%), linear-gradient(165deg, #0a0a0a 0%, #121212 45%, #0d1510 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, transparent 30%, rgba(0,0,0,0.2) 100%)",
    tokens: darkTokens({
      bg: "#121212",
      "sider-bg": "rgba(255,255,255,0.1)",
      "bar-bg": "rgba(8,8,10,0.22)",
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
    description: "暗夜红烬壁纸 · 半透暖侧栏",
    mode: "dark",
    layout: "desktop",
    preview: ["#141414", "#ec4141", "#2a1a1a"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(1000px 520px at 15% 0%, rgba(236,65,65,0.28), transparent 55%), radial-gradient(800px 480px at 95% 90%, rgba(120,30,30,0.4), transparent 52%), linear-gradient(160deg, #0c0808 0%, #141010 42%, #1a0e0e 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(0,0,0,0.18) 0%, transparent 28%, rgba(20,0,0,0.22) 100%)",
    tokens: darkTokens({
      bg: "#141414",
      "sider-bg": "rgba(255,220,220,0.1)",
      "bar-bg": "rgba(18,10,10,0.22)",
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
    description: "深海蓝径向光晕 · 毛玻璃壳层",
    mode: "dark",
    layout: "desktop",
    preview: ["#0f1419", "#3d8bfd", "#1a2330"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(1100px 700px at 50% -15%, rgba(61,139,253,0.28), transparent 58%), radial-gradient(700px 500px at 0% 100%, rgba(20,50,100,0.4), transparent 50%), linear-gradient(170deg, #080c12 0%, #0f1419 48%, #0a121c 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(0,8,20,0.16) 0%, transparent 32%, rgba(0,0,0,0.22) 100%)",
    tokens: darkTokens({
      bg: "#0f1419",
      "sider-bg": "rgba(180,210,255,0.1)",
      "bar-bg": "rgba(8,12,18,0.22)",
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
    description: "柔和灰阶渐变壁纸 · 半透专业壳",
    mode: "dark",
    layout: "desktop",
    preview: ["#1c1e22", "#a8b0bc", "#2a2d33"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(900px 500px at 30% -5%, rgba(168,176,188,0.14), transparent 55%), linear-gradient(145deg, #14161a 0%, #1c1e22 40%, #22262c 100%), linear-gradient(0deg, #181a1e, #1e2026)",
    },
    overlay:
      "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, transparent 35%, rgba(0,0,0,0.18) 100%)",
    tokens: darkTokens({
      bg: "#1c1e22",
      "sider-bg": "rgba(255,255,255,0.1)",
      "bar-bg": "rgba(14,16,20,0.22)",
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
    description: "清凉白光壁纸 · 半透日间毛玻璃",
    mode: "light",
    layout: "desktop",
    preview: ["#f5f6f8", "#2563eb", "#ffffff"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(1000px 560px at 18% -8%, rgba(37,99,235,0.12), transparent 55%), radial-gradient(800px 480px at 100% 90%, rgba(147,197,253,0.18), transparent 50%), linear-gradient(165deg, #eef1f6 0%, #f5f6f8 45%, #e8ecf2 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 40%, rgba(230,235,245,0.25) 100%)",
    tokens: lightTokens({
      bg: "#f5f6f8",
      "sider-bg": "rgba(255,255,255,0.48)",
      "bar-bg": "rgba(255,255,255,0.2)",
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
    description: "暖纸质渐变壁纸 · 半透柔和壳层",
    mode: "light",
    layout: "desktop",
    preview: ["#f3f0ea", "#b45309", "#fffcf7"],
    wallpaper: {
      type: "css",
      value:
        "radial-gradient(1000px 540px at 25% -10%, rgba(180,83,9,0.1), transparent 55%), radial-gradient(700px 420px at 95% 85%, rgba(217,119,6,0.12), transparent 50%), linear-gradient(160deg, #efe8dc 0%, #f3f0ea 42%, #f7f2e8 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(255,252,247,0.4) 0%, transparent 38%, rgba(245,235,220,0.28) 100%)",
    tokens: lightTokens({
      bg: "#f3f0ea",
      "sider-bg": "rgba(255,255,255,0.45)",
      "bar-bg": "rgba(255,250,244,0.2)",
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
  {
    id: "honey-pop",
    name: "蜜糖泡泡",
    description: "暖黄一体氛围 · 圆角毛玻璃导航（QQ 风）",
    mode: "light",
    layout: "desktop",
    preview: ["#f3e0a0", "#f0c14a", "#faf0c8"],
    wallpaper: {
      type: "image",
      src: "/skins/honey-pop/bg.jpg",
      fallback:
        "linear-gradient(145deg, #f7e8b0 0%, #f0d98a 48%, #f5e6b8 100%)",
    },
    /* 几乎无遮罩，保持整窗同色氛围 */
    overlay: "none",
    tokens: lightTokens({
      bg: "#f3e0a0",
      /* 导航胶囊 / 品牌卡：半透明白雾毛玻璃 */
      "sider-bg": "rgba(255,255,255,0.42)",
      "bar-bg": "rgba(255,250,230,0.22)",
      surface: "rgba(255,255,255,0.28)",
      "surface-2": "rgba(255,255,255,0.4)",
      primary: "#e89a0c",
      "primary-hover": "#f0a820",
      "primary-pressed": "#c87e08",
      "primary-soft": "rgba(232,154,12,0.16)",
      "accent-secondary": "#f5c542",
      "panel-blur": "20px",
      text: "rgba(72,52,18,0.92)",
      "text-muted": "rgba(72,52,18,0.58)",
      "text-faint": "rgba(72,52,18,0.4)",
      border: "rgba(255,255,255,0.45)",
      "border-strong": "rgba(180,130,40,0.18)",
      "radius-md": "12px",
      "radius-lg": "14px",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#e89a0c",
        primaryColorHover: "#f0a820",
        primaryColorPressed: "#c87e08",
        primaryColorSuppl: "#e89a0c",
        bodyColor: "#f3e0a0",
        cardColor: "rgba(255,252,240,0.88)",
        modalColor: "#fffaf0",
        popoverColor: "#ffffff",
        borderColor: "rgba(180,130,40,0.14)",
        borderRadius: "12px",
      },
    },
  },
  {
    id: "misty-lake",
    name: "岚湖夜",
    description: "月夜星湖倒影 · 低刺激护眼壁纸",
    mode: "dark",
    layout: "desktop",
    preview: ["#0c1a28", "#5aa8b8", "#163040"],
    wallpaper: {
      type: "image",
      src: "/skins/misty-lake/bg.jpg",
      fallback:
        "linear-gradient(160deg, #101c20 0%, #152428 48%, #0e1a1e 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(0,12,16,0.18) 0%, transparent 36%, rgba(0,8,12,0.28) 100%)",
    tokens: darkTokens({
      bg: "#152428",
      "sider-bg": "rgba(180,220,230,0.1)",
      "bar-bg": "rgba(8,16,20,0.24)",
      surface: "rgba(255,255,255,0.06)",
      "surface-2": "rgba(255,255,255,0.11)",
      primary: "#5aa8b8",
      "primary-hover": "#6ebccc",
      "primary-pressed": "#478a98",
      "primary-soft": "rgba(90,168,184,0.18)",
      "accent-secondary": "#8ec8d4",
      "panel-blur": "20px",
      text: "rgba(230,242,246,0.92)",
      "text-muted": "rgba(230,242,246,0.58)",
      "text-faint": "rgba(230,242,246,0.38)",
      border: "rgba(255,255,255,0.1)",
      "border-strong": "rgba(255,255,255,0.16)",
      "radius-md": "12px",
      "radius-lg": "14px",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#5aa8b8",
        primaryColorHover: "#6ebccc",
        primaryColorPressed: "#478a98",
        primaryColorSuppl: "#5aa8b8",
        bodyColor: "#152428",
        cardColor: "#1a2c32",
        modalColor: "#1a2c32",
        popoverColor: "#21363c",
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: "12px",
      },
    },
  },
  {
    id: "cloud-drift",
    name: "云海漫游",
    description: "晴空云层静图 · 清爽浅蓝壁纸",
    mode: "light",
    layout: "desktop",
    preview: ["#d8e8f6", "#3b82c4", "#eef5fc"],
    wallpaper: {
      type: "image",
      src: "/skins/cloud-drift/bg.jpg",
      fallback:
        "linear-gradient(165deg, #c8ddf0 0%, #e4eef8 48%, #d2e4f4 100%)",
    },
    overlay:
      "linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 42%, rgba(210,230,245,0.2) 100%)",
    tokens: lightTokens({
      bg: "#d8e8f6",
      "sider-bg": "rgba(255,255,255,0.5)",
      "bar-bg": "rgba(250,252,255,0.24)",
      surface: "rgba(255,255,255,0.36)",
      "surface-2": "rgba(255,255,255,0.48)",
      primary: "#3b82c4",
      "primary-hover": "#4f94d4",
      "primary-pressed": "#2f6aa3",
      "primary-soft": "rgba(59,130,196,0.14)",
      "accent-secondary": "#7eb6e0",
      "panel-blur": "20px",
      text: "rgba(24,36,52,0.92)",
      "text-muted": "rgba(24,36,52,0.58)",
      "text-faint": "rgba(24,36,52,0.4)",
      border: "rgba(255,255,255,0.55)",
      "border-strong": "rgba(50,90,130,0.16)",
      "radius-md": "12px",
      "radius-lg": "14px",
    }),
    naiveOverrides: {
      common: {
        primaryColor: "#3b82c4",
        primaryColorHover: "#4f94d4",
        primaryColorPressed: "#2f6aa3",
        primaryColorSuppl: "#3b82c4",
        bodyColor: "#d8e8f6",
        cardColor: "rgba(248,252,255,0.92)",
        modalColor: "#f4f9fd",
        popoverColor: "#ffffff",
        borderColor: "rgba(50,90,130,0.12)",
        borderRadius: "12px",
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
    root.style.removeProperty("--wallpaper-video");
    root.style.removeProperty("--wallpaper-poster");
  } else if (skin.wallpaper.type === "image") {
    const fallback = skin.wallpaper.fallback ?? skin.tokens.bg;
    root.style.setProperty("--wallpaper", fallback);
    root.style.setProperty(
      "--wallpaper-image",
      `url("${skin.wallpaper.src}")`,
    );
    root.style.removeProperty("--wallpaper-video");
    root.style.removeProperty("--wallpaper-poster");
  } else {
    // video：CSS 层用 poster/fallback 兜底，真实视频由 WallpaperLayer 播放
    const fallback = skin.wallpaper.fallback ?? skin.tokens.bg;
    root.style.setProperty("--wallpaper", fallback);
    if (skin.wallpaper.poster) {
      root.style.setProperty(
        "--wallpaper-image",
        `url("${skin.wallpaper.poster}")`,
      );
      root.style.setProperty(
        "--wallpaper-poster",
        `url("${skin.wallpaper.poster}")`,
      );
    } else {
      root.style.removeProperty("--wallpaper-image");
      root.style.removeProperty("--wallpaper-poster");
    }
    root.style.setProperty("--wallpaper-video", skin.wallpaper.src);
  }

  if (skin.overlay) {
    root.style.setProperty("--wallpaper-overlay", skin.overlay);
  } else {
    root.style.setProperty("--wallpaper-overlay", "none");
  }

  root.style.colorScheme = skin.mode;
  activeSkin.value = skin;
}
