# 全窗换肤（壁纸 + 磨砂壳）设计说明

**日期：** 2026-08-03  
**状态：** 已确认  
**范围：** 将现有「仅换主题色」升级为整窗壁纸皮肤；侧栏 / 顶栏 / 底栏半透明磨砂；列表透明融入背景。

---

## 1. 背景与目标

### 现状
- 皮肤体系在 `src/themes/`（`types` / `registry` / `apply` / `tokens.css`）。
- 6 套皮肤（黑曜石、朱砂、钴蓝、岩灰、瓷白、宣纸）主要通过 CSS 变量改配色。
- 布局为统一桌面壳（侧栏 + 主区 + 播放条）；`ThemeDecor` 已空置。
- 设置文案仍写「皮肤只改变配色，不影响窗口布局」。

### 目标
1. **整窗壁纸**：CSS 氛围背景或图片 `cover` 铺满应用壳。
2. **磨砂配对**：侧栏、标题栏、播放条半透明 + blur，透出壁纸。
3. **列表融入**：列表不做实心白卡片；底透明，仅 hover / 当前曲有 soft 强调。
4. **双模式壁纸**：同一皮肤模型支持 `css` 与 `image`。
5. **基础 6 套**用 CSS 壁纸升级；**新增 2 套**用生成图片壁纸。

### 非目标（本轮不做）
- 用户上传 / 自定义壁纸
- 改变导航或窗口布局结构
- 皮肤商店 / 第三方皮肤包格式
- 为迷你窗、桌面歌词单独做插画皮肤（仅同步 color tokens / 可读即可）

---

## 2. 视觉架构

固定三层（由底到顶）：

| 层 | 职责 | 实现建议 |
|----|------|----------|
| L0 壁纸 | 全窗背景 | `.app-shell::before` 或专用层：`background` 取自皮肤 |
| L1 遮罩 | 可选可读性 | 弱暗角 / 纵向渐变；token 或 `overlay` 字段 |
| L2 UI | 交互壳 | 侧栏 / 标题栏 / 播放条磨砂；主区与列表透明 |

### 区域规范

| 区域 | 表现 |
|------|------|
| 壁纸 | 整窗；图片 `background-size: cover; background-position: center` |
| 侧栏 `.app-nav` | 半透明 + `backdrop-filter: blur(...)`，透壁纸 |
| 标题栏 `.title-bar` | 与侧栏同系磨砂（可用同一 `sider-bg` 或独立 `titlebar-bg`） |
| 播放条 `.player-bar` | 配对半透明 + blur |
| 主区 `.app-main` / 列表 | **无实心卡片底板**；`background: transparent`；行 hover / active 用 soft |
| 弹层 / 设置 / 主题窗 | 略实 surface，保证控件可读（可不强制透壁纸） |

### 磨砂默认档（中等偏透）
- `panel-blur`：约 `12px`–`16px`
- 面板底：约 45%–60% 不透明度的 rgba（深色皮肤偏黑，浅色偏白）
- 实现时可用 CSS 变量微调，不必写死在组件里

---

## 3. 数据模型

### 壁纸

```ts
export type SkinWallpaper =
  | { type: "css"; value: string }
  // value：可赋给 CSS background 的完整值（可含多层 gradient）
  | { type: "image"; src: string; fallback?: string };
  // src：站点根路径，如 /skins/honey-pop/bg.webp
  // fallback：可选纯色或短 gradient，图片加载失败时使用
```

### SkinDefinition 增量

在现有字段上增加：

```ts
export interface SkinDefinition {
  // ...既有 id, name, description, mode, layout, preview, tokens, naiveOverrides
  wallpaper: SkinWallpaper;
  /** 叠在壁纸上的可选遮罩（CSS background 值） */
  overlay?: string;
}
```

### Token 调整 / 新增

沿用现有 `TokenKey`，并做以下约定：

| Token | 用途变化 |
|-------|----------|
| `bg` | 壳层回退色 / 遮罩底；不再单独充当「唯一实心底」 |
| `bg-grad` | 可与 CSS 壁纸对齐，或作兼容别名 |
| `sider-bg` | **半透明** rgba，配合 blur |
| `bar-bg` | **半透明** rgba，播放条 |
| `panel-blur` | 从 `0px` 改为有意义的 blur（如 `14px`） |
| `surface` / `surface-2` | 列表 hover 等轻表面，保持低对比透明 |
| `primary-soft` | 列表 active / 选中行 |

可选新增（若实现时需要，写入 types）：

- `titlebar-bg`：若与 sider 需区分
- `wallpaper` 不进 tokens 字典，走 `SkinDefinition.wallpaper`，由 apply 写成 `--wallpaper` / `--wallpaper-image` 等

### apply 行为

`applySkinToDocument(skin)`：

1. 设置 `data-skin` / `data-mode` / `data-layout`（不变）
2. 写入全部 tokens 为 CSS 变量
3. 根据 `wallpaper`：
   - `css` → `--wallpaper: <value>`；清空图片相关变量
   - `image` → `--wallpaper: var(--wallpaper-fallback, <fallback|bg>)` + `--wallpaper-image: url(<src>)`
4. 若有 `overlay` → `--wallpaper-overlay`
5. 保持 naive-ui overrides 由现有入口消费（settings / App）

CSS 示意：

```css
.app-shell {
  position: relative;
  background: var(--bg);
  isolation: isolate;
}
.app-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--wallpaper-image, none), var(--wallpaper, var(--bg));
  background-size: cover, auto;
  background-position: center, center;
}
.app-shell::after {
  /* 可选 overlay */
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--wallpaper-overlay, none);
}
.app-shell > * {
  position: relative;
  z-index: 1;
}
.app-nav, .title-bar, .player-bar {
  background: var(--sider-bg); /* bar 用 --bar-bg */
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
}
.app-main, .content-list, .track-list {
  background: transparent !important;
}
```

注意：当前 `tokens.css` 中 `.layout-content, .app-main { background: var(--bg) !important; }` 需改为透明或仅保留 `--bg` 作无壁纸时的回退，避免盖住壁纸。

---

## 4. 皮肤清单

### 4.1 基础皮肤（6）— CSS 壁纸

在现有配色语义上升级为氛围渐变 + 半透明壳，**不改 id**（兼容 `localStorage` / `LEGACY_SKIN_MAP`）。

| ID | 名称 | mode | CSS 壁纸方向（示例） |
|----|------|------|----------------------|
| `obsidian` | 黑曜石 | dark | 深黑 + 青绿光晕 |
| `cinnabar` | 朱砂 | dark | 暗底 + 红焰微光 |
| `cobalt` | 钴蓝 | dark | 深蓝灰 + 冷蓝光 |
| `slate` | 岩灰 | dark | 中性灰阶渐变 |
| `porcelain` | 瓷白 | light | 浅灰白柔光 |
| `paper` | 宣纸 | light | 暖纸色纵向/径向柔和渐变 |

`preview` 三色条保留，用于选择器无图时的色条；可选第二行小预览用 `wallpaper` 渲染。

### 4.2 新增皮肤（2）— 图片壁纸

| ID | 名称 | mode | 气质 | 资源路径（建议） |
|----|------|------|------|------------------|
| `honey-pop` | 蜜糖泡泡 | light（或 soft light） | 黄色可爱：暖黄、奶油、软光、圆润色块 | `public/skins/honey-pop/bg.webp` |
| `moss-forest` | 青苔森野 | dark | 森系：林荫、雾气、苔藓绿 | `public/skins/moss-forest/bg.webp` |

**图片规格建议：**
- 分辨率约 1920×1080 或 1600×900（桌面壳足够）
- 优先 WebP；若工具链不便可用 PNG 再压
- 生成工具：Imagine（`image_gen`）
- 画面需预留「中部略干净」或整体不过曝，便于磨砂后文字可读
- `honey-pop`：明亮暖黄，可爱插画感，避免刺眼纯黄满屏
- `moss-forest`：深绿森林氛围，可有薄雾与光斑，避免死黑

**Token 配对要点：**
- `honey-pop`：primary 琥珀/蜜黄；sider/bar 半透明暖白；text 深棕灰
- `moss-forest`：primary 叶绿/松绿；sider/bar 半透明深墨绿；text 浅米白

`SkinId` 联合类型扩展上述两个 id。

---

## 5. UI 与入口

### 主题窗 / SkinPicker
- 列表展示 8 套皮肤。
- 预览：
  - `wallpaper.type === "css"`：用 preview 渐变或 `wallpaper.value` 缩略
  - `type === "image"`：`background-image: url(src)` 缩略 + 模式角标
- 设置窗文案由「只改变配色」改为「更换整窗皮肤（壁纸与面板样式）」。

### 多窗口
- 主窗：完整壁纸 + 磨砂壳。
- 设置窗 / 主题窗：可只应用 tokens（或简化底），不强制大图壁纸占满（实现时优先保证主窗正确；子窗至少 mode + primary 正确）。
- Mini / 桌面歌词：继续 `applySkin` 同步色板即可。

---

## 6. 实现落点（文件级）

| 区域 | 文件 | 变更 |
|------|------|------|
| 类型 | `src/themes/types.ts` | `SkinWallpaper`、`SkinId` 扩展、`SkinDefinition` 字段 |
| 注册表 | `src/themes/registry.ts` | 6 套 wallpaper CSS；2 套 image；半透明 tokens；`applySkinToDocument` |
| 应用 | `src/themes/apply.ts` | 透传（若有额外逻辑） |
| 样式 | `src/themes/tokens.css` | 壁纸层、磨砂、主区/列表透明；去掉盖死壁纸的实心 `app-main` |
| 布局 | `src/themes/layouts.css` | 按需微调 |
| 壳 | `MainView.vue` 等 | 确认 `app-shell` 类名与伪元素层级；子元素不设不透明满底 |
| 组件 | `TitleBar` / `PlayerBar` / 列表相关 | 去掉硬编码实色背景（若有） |
| 选择 UI | `SkinPicker.vue` / `ThemeWindow.vue` / `SettingsWindow.vue` | 预览与文案 |
| 资源 | `public/skins/honey-pop/`、`public/skins/moss-forest/` | 壁纸图 |

---

## 7. 兼容与迁移

- `resolveSkinId` / `LEGACY_SKIN_MAP` 保持；新 id 直接加入 `SKINS`。
- 旧用户 localStorage 中的 6 个 id 无感升级到新视觉。
- 未知 id 仍回退 `obsidian`。

---

## 8. 验证清单

1. 切换 6 套基础皮肤：整窗 CSS 氛围变化，侧栏/底栏透出背景，列表无白块。
2. 切换 `honey-pop` / `moss-forest`：图片 cover 正确，磨砂可读，primary 与预览一致。
3. 列表 hover / 当前播放行对比度可接受（深浅皮肤各测）。
4. 主题窗选择、设置页名称、重启后 skinId 持久化。
5. 浅色皮肤下毛玻璃与边框不「脏边」过度。
6. 图片 404 时 fallback 不至完全不可用（若实现 fallback）。

---

## 9. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 壁纸过花导致字不可读 | overlay + 面板不透明度下限；生成图时控制对比 |
| `backdrop-filter` 性能 | blur 控制在 ~16px；避免多层同时大面积 blur |
| 打包体积 | 两张 webp，单张控制在合理体积 |
| 组件内联实色 | 实现时 grep 硬编码 `#fff` / `background` 并改为 token |

---

## 10. 决策记录

- 架构：**扩展现有 token / registry**（非独立皮肤包、非每皮肤 CSS 文件体系）。
- 壁纸：CSS + 图片双支持；基础 6 套 CSS，新 2 套图片。
- 新皮肤主题：**蜜糖泡泡（黄·可爱）**、**青苔森野（森系）**。
- 磨砂：**中等偏透**。
- 列表：**透明融入，非卡片白块**。
- 本轮不做自定义上传壁纸。
