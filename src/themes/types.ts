import type { GlobalThemeOverrides } from "naive-ui";

/** 当前可用皮肤（旧 id 会在 resolve 时映射） */
export type SkinId =
  | "obsidian"
  | "cinnabar"
  | "cobalt"
  | "slate"
  | "porcelain"
  | "paper"
  | "honey-pop"
  | "moss-forest"
  | "sage-mist"
  | "cloud-tea"
  | "lavender-haze"
  | "misty-lake";

/** 统一桌面壳布局；皮肤只改色与壁纸，不改结构 */
export type LayoutId = "desktop";

export type SkinMode = "dark" | "light";

/** 壁纸：CSS background 值，或 public 下图片 */
export type SkinWallpaper =
  | { type: "css"; value: string }
  | { type: "image"; src: string; fallback?: string };

/** CSS 变量键（不含 -- 前缀） */
export type TokenKey =
  | "bg"
  | "bg-grad"
  | "sider-bg"
  | "bar-bg"
  | "surface"
  | "surface-2"
  | "text"
  | "text-muted"
  | "text-faint"
  | "primary"
  | "primary-hover"
  | "primary-pressed"
  | "primary-soft"
  | "border"
  | "border-strong"
  | "radius-sm"
  | "radius-md"
  | "radius-lg"
  | "shadow"
  | "glow"
  | "player-height"
  | "sider-width"
  | "cover-radius"
  | "panel-blur"
  | "accent-secondary"
  | "noise-opacity"
  | "grid-opacity";

export type SkinTokens = Record<TokenKey, string>;

export interface SkinDefinition {
  id: SkinId;
  name: string;
  description: string;
  mode: SkinMode;
  layout: LayoutId;
  /** 设置页预览色条 */
  preview: [string, string, string];
  /** 全窗壁纸 */
  wallpaper: SkinWallpaper;
  /** 叠在壁纸上的可选遮罩（CSS background） */
  overlay?: string;
  tokens: SkinTokens;
  naiveOverrides: GlobalThemeOverrides;
}
