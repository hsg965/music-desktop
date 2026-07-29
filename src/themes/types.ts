import type { GlobalThemeOverrides } from "naive-ui";

export type SkinId =
  | "midnight-violet"
  | "cyber-neon"
  | "vinyl-night"
  | "glass-ocean"
  | "paper-light"
  | "macaron-soft"
  | "sakura-mist"
  | "sky-breeze"
  | "lemon-cream"
  | "mint-fresh"
  | "lavender-cloud"
  | "nordic-snow"
  | "peach-sunset"
  | "matcha-latte";

export type LayoutId =
  | "classic"
  | "neon-rail"
  | "vinyl-stage"
  | "glass-float"
  | "paper-split"
  | "soft-dock";

export type SkinMode = "dark" | "light";

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
  tokens: SkinTokens;
  naiveOverrides: GlobalThemeOverrides;
}
