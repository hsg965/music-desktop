import type { GlobalThemeOverrides } from "naive-ui";

/** 当前可用皮肤（旧 id 会在 resolve 时映射） */
export type SkinId =
  | "obsidian"
  | "cinnabar"
  | "cobalt"
  | "slate"
  | "porcelain"
  | "paper";

/** 统一桌面壳布局；皮肤只改色，不改结构 */
export type LayoutId = "desktop";

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
