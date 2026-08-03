# Full-Window Skin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade theming from solid color tokens to full-window wallpaper skins (CSS or image) with frosted sidebar/title/player bars and transparent lists; keep six base skins on CSS wallpapers and add two image skins (`honey-pop`, `moss-forest`).

**Architecture:** Extend `SkinDefinition` with `wallpaper` + optional `overlay`. `applySkinToDocument` writes CSS variables (`--wallpaper`, `--wallpaper-image`, `--wallpaper-overlay`). Global shell styles on `.app-shell` use pseudo-elements for L0/L1 layers; chrome panels use translucent tokens + `backdrop-filter`. Image assets live under `public/skins/<id>/`.

**Tech Stack:** Vue 3, TypeScript, Pinia settings store, existing `src/themes/*`, Vite `public/` static assets, Imagine for wallpaper PNGs/WebP.

**Spec:** `docs/superpowers/specs/2026-08-03-full-window-skin-design.md`

**Verification:** No unit test runner in repo; use `pnpm typecheck` after type/registry changes and manual UI check for shell chrome. Do not claim done without typecheck pass.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/themes/types.ts` | `SkinId`, `SkinWallpaper`, `SkinDefinition` fields |
| `src/themes/registry.ts` | All 8 skins, wallpaper apply logic |
| `src/themes/apply.ts` | Re-export (no logic change unless needed) |
| `src/themes/tokens.css` | Default tokens, wallpaper layers, frosted chrome, transparent main/list |
| `public/skins/honey-pop/bg.png` (or `.webp`) | Cute yellow wallpaper |
| `public/skins/moss-forest/bg.png` (or `.webp`) | Forest wallpaper |
| `src/components/SkinPicker.vue` | Preview CSS vs image |
| `src/views/ThemeWindow.vue` | Same preview + copy if duplicated |
| `src/views/SettingsWindow.vue` | Hint text update |
| Components with hard solid page backgrounds | Only if they block wallpaper (grep during Task 4) |

---

### Task 1: Types — wallpaper model + new SkinIds

**Files:**
- Modify: `src/themes/types.ts`

- [ ] **Step 1: Update `SkinId` and add wallpaper types**

Replace/extend the top of `src/themes/types.ts` so it includes:

```ts
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
  | "moss-forest";

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
```

- [ ] **Step 2: Typecheck (expect registry errors until Task 2/3)**

Run: `pnpm typecheck`

Expected: errors in `registry.ts` about missing `wallpaper` / invalid SkinId — that is OK; fix in next tasks. If errors appear only in unrelated files, stop and investigate.

- [ ] **Step 3: Commit**

```bash
git add src/themes/types.ts
git commit -m "feat(themes): add wallpaper types and new skin ids"
```

---

### Task 2: applySkinToDocument — wallpaper CSS variables

**Files:**
- Modify: `src/themes/registry.ts` (`applySkinToDocument` only in this task; skins filled in Task 3–5)

- [ ] **Step 1: Replace `applySkinToDocument` to set wallpaper vars**

In `src/themes/registry.ts`, replace `applySkinToDocument` with:

```ts
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
```

Keep existing `getSkin` / `resolveSkinId` / `LEGACY_SKIN_MAP` / `DEFAULT_SKIN_ID` unchanged in this step.

- [ ] **Step 2: Commit**

```bash
git add src/themes/registry.ts
git commit -m "feat(themes): apply wallpaper CSS variables on skin switch"
```

---

### Task 3: tokens.css — shell wallpaper layers + frosted chrome

**Files:**
- Modify: `src/themes/tokens.css`

- [ ] **Step 1: Update `:root` defaults for frosted shell**

In `:root`, set meaningful defaults (match obsidian-ish):

```css
:root {
  --bg: #121212;
  --bg-grad: #121212;
  --wallpaper: #121212;
  --wallpaper-overlay: none;
  /* --wallpaper-image unset until image skin */
  --sider-bg: rgba(0, 0, 0, 0.55);
  --bar-bg: rgba(24, 24, 24, 0.55);
  --surface: rgba(255, 255, 255, 0.06);
  --surface-2: rgba(255, 255, 255, 0.1);
  /* ... keep text/primary/border tokens as today ... */
  --panel-blur: 14px;
  --glass-blur: 14px;
  /* rest unchanged */
}
```

- [ ] **Step 2: Add wallpaper layers on `.app-shell`**

Replace or extend `.app-shell` block:

```css
.app-shell {
  position: relative;
  background: var(--bg);
  color: var(--text);
  isolation: isolate;
  overflow: hidden;
}

.app-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background-color: var(--bg);
  background-image: var(--wallpaper-image, none), var(--wallpaper);
  background-size: cover, cover;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
}

.app-shell::after {
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
```

Note: For `wallpaper.type === "css"`, `--wallpaper` is a full `background` value string (e.g. multi-stop `linear-gradient(...)`). Using it only in `background-image` works for gradients. Prefer:

```css
.app-shell::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: var(--wallpaper-image, none), var(--wallpaper, var(--bg));
  background-size: cover, auto;
  background-position: center, center;
  background-repeat: no-repeat, no-repeat;
}
```

If a CSS wallpaper is a multi-layer gradient assigned as one `background` shorthand string, set `--wallpaper` to that full value and use:

```css
/* When no image: single background shorthand via custom property is tricky.
   Convention: always store CSS wallpapers as background-image-capable values
   (gradients only). Image skins set --wallpaper to solid/gradient fallback. */
```

**Convention locked for implementers:**  
- CSS skins: `wallpaper.value` = one or more gradients suitable for `background-image` (comma-separated OK).  
- Image skins: `--wallpaper-image: url(...)` + `--wallpaper` = solid or simple gradient fallback.

- [ ] **Step 3: Frost title bar, nav, player; transparent main/list**

Update existing rules:

```css
.title-bar {
  height: var(--titlebar-height);
  min-height: var(--titlebar-height);
  flex-shrink: 0;
  background: var(--sider-bg);
  border-bottom: 1px solid var(--border);
  color: var(--text);
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
}

.app-nav {
  width: var(--sider-width);
  min-width: var(--sider-width);
  background: var(--sider-bg);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 12px 10px 16px;
  gap: 4px;
  user-select: none;
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
}

.app-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
  background: transparent;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* REMOVE or replace the rule that forces solid bg: */
.layout-content,
.app-main {
  background: transparent !important;
}

.player-bar {
  height: var(--player-height);
  min-height: var(--player-height);
  flex-shrink: 0;
  background: var(--bar-bg);
  border-top: 1px solid var(--border);
  color: var(--text);
  backdrop-filter: blur(var(--panel-blur));
  -webkit-backdrop-filter: blur(var(--panel-blur));
}

.content-list,
.track-list {
  background: transparent;
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  min-width: 0;
  background: transparent;
}
```

Keep `.track-row` hover/active using `surface-2` / `primary-soft` as today.

- [ ] **Step 4: Commit**

```bash
git add src/themes/tokens.css
git commit -m "feat(themes): wallpaper layers and frosted chrome shell"
```

---

### Task 4: Upgrade six base skins to CSS wallpapers + translucent panels

**Files:**
- Modify: `src/themes/registry.ts` (each of the six `SKINS` entries)

- [ ] **Step 1: Adjust `darkTokens` / `lightTokens` defaults for frost**

In helper defaults, change:

```ts
// darkTokens defaults:
"panel-blur": "14px",
// lightTokens defaults:
"panel-blur": "14px",
```

Do **not** force opaque sider/bar in helpers; each skin will pass translucent values.

- [ ] **Step 2: Add `wallpaper` (+ optional `overlay`) and translucent sider/bar for each of the six**

For each existing skin object, add fields and update `sider-bg` / `bar-bg` / `bg-grad`. Example for **obsidian** (repeat pattern for others with their hues):

```ts
{
  id: "obsidian",
  name: "黑曜石",
  description: "深空氛围壁纸 · 青绿强调 · 磨砂侧栏",
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
    "bg-grad": "#121212",
    "sider-bg": "rgba(0,0,0,0.55)",
    "bar-bg": "rgba(18,18,18,0.55)",
    primary: "#1db954",
    "primary-hover": "#1ed760",
    "primary-pressed": "#169c46",
    "primary-soft": "rgba(29,185,84,0.16)",
    "accent-secondary": "#1ed760",
    "panel-blur": "14px",
  }),
  naiveOverrides: { /* keep existing, bodyColor can stay solid for dialogs */ },
}
```

**Per-skin wallpaper intent (must implement all six):**

| id | Wallpaper idea | sider-bg | bar-bg |
|----|----------------|----------|--------|
| obsidian | black + green glow | `rgba(0,0,0,0.55)` | `rgba(18,18,18,0.55)` |
| cinnabar | dark + red embers | `rgba(12,8,8,0.55)` | `rgba(26,18,18,0.55)` |
| cobalt | deep blue radial | `rgba(8,12,18,0.55)` | `rgba(15,22,32,0.55)` |
| slate | grey soft gradient | `rgba(16,18,22,0.55)` | `rgba(28,30,36,0.55)` |
| porcelain | soft cool white light | `rgba(255,255,255,0.55)` | `rgba(255,255,255,0.6)` |
| paper | warm paper wash | `rgba(255,252,247,0.55)` | `rgba(255,252,247,0.6)` |

Light skins: slightly stronger panel opacity if text washes out (`0.62`–`0.7` OK).

Update `darkTokens` / `lightTokens` `Pick<>` types if you add required keys like `"bg-grad"` — only if TypeScript complains; otherwise pass via `partial`.

- [ ] **Step 3: Ensure MainView root uses `app-shell`**

Confirm `src/views/MainView.vue` root is `class="app-shell ..."` (already is). Do not remove the class.

- [ ] **Step 4: Grep for solid covers that hide wallpaper on main shell**

Run search in `src/` for rules forcing opaque page backgrounds on main content (e.g. `background: var(--bg) !important` outside dialogs). Fix only main-shell offenders so lists stay transparent. Leave Settings/Theme window solid or lightly token-based (spec allows solid subwindows).

- [ ] **Step 5: Typecheck**

Run: `pnpm typecheck`  
Expected: PASS if only six skins still — **will FAIL** if `honey-pop` / `moss-forest` not yet in `SKINS` but are in `SkinId` union (union doesn't require registry entries). Typecheck should pass once all six have `wallpaper`. New ids in union are fine without being in array.

- [ ] **Step 6: Commit**

```bash
git add src/themes/registry.ts src/themes/tokens.css src/**/*.vue
git commit -m "feat(themes): upgrade six base skins to CSS wallpapers"
```

---

### Task 5: Generate wallpaper images

**Files:**
- Create: `public/skins/honey-pop/bg.png`
- Create: `public/skins/moss-forest/bg.png`

Use Imagine (`image_gen`). Prefer saving into the project paths above. If the tool only returns a session path, copy into `public/skins/...`.

- [ ] **Step 1: Generate honey-pop wallpaper**

Prompt (use with `image_gen`, aspect `16:9`):

```
Desktop app wallpaper, cute kawaii yellow theme, soft warm honey and cream colors, gentle pastel yellow bubbles and soft rounded shapes, dreamy soft lighting, subtle sparkles, no text, no UI, no logos, no people faces, clean composition with slightly calmer center area for readability, high resolution digital illustration, warm cozy cheerful mood
```

Save/copy to: `public/skins/honey-pop/bg.png`

- [ ] **Step 2: Generate moss-forest wallpaper**

Prompt (aspect `16:9`):

```
Desktop app wallpaper, misty forest interior, mossy trees soft green foliage, volumetric light rays through canopy, deep teal and forest green palette, gentle fog, atmospheric nature illustration, no text, no UI, no logos, no people, slightly darker lower third, high resolution digital art, calm immersive mood
```

Save/copy to: `public/skins/moss-forest/bg.png`

- [ ] **Step 3: Verify files exist**

```bash
# PowerShell
Test-Path public/skins/honey-pop/bg.png
Test-Path public/skins/moss-forest/bg.png
```

Expected: both `True`. Optionally compress later; PNG is acceptable for v1.

- [ ] **Step 4: Commit assets**

```bash
git add public/skins/honey-pop/bg.png public/skins/moss-forest/bg.png
git commit -m "assets: add honey-pop and moss-forest skin wallpapers"
```

---

### Task 6: Register honey-pop and moss-forest skins

**Files:**
- Modify: `src/themes/registry.ts`

- [ ] **Step 1: Append `honey-pop` skin definition**

```ts
{
  id: "honey-pop",
  name: "蜜糖泡泡",
  description: "暖黄可爱壁纸 · 奶油磨砂壳",
  mode: "light",
  layout: "desktop",
  preview: ["#fff6d6", "#f5b942", "#ffe8a3"],
  wallpaper: {
    type: "image",
    src: "/skins/honey-pop/bg.png",
    fallback:
      "linear-gradient(160deg, #fff6d6 0%, #ffe8a3 50%, #ffd77a 100%)",
  },
  overlay:
    "linear-gradient(180deg, rgba(255,250,230,0.25) 0%, transparent 40%, rgba(80,50,10,0.12) 100%)",
  tokens: lightTokens({
    bg: "#fff6d6",
    "sider-bg": "rgba(255,252,240,0.58)",
    "bar-bg": "rgba(255,250,235,0.62)",
    primary: "#d97706",
    "primary-hover": "#f59e0b",
    "primary-pressed": "#b45309",
    "primary-soft": "rgba(217,119,6,0.14)",
    "accent-secondary": "#fbbf24",
    "panel-blur": "16px",
    text: "rgba(60,40,10,0.92)",
    "text-muted": "rgba(60,40,10,0.58)",
    "text-faint": "rgba(60,40,10,0.4)",
    border: "rgba(120,80,20,0.12)",
    "border-strong": "rgba(120,80,20,0.2)",
  }),
  naiveOverrides: {
    common: {
      primaryColor: "#d97706",
      primaryColorHover: "#f59e0b",
      primaryColorPressed: "#b45309",
      primaryColorSuppl: "#d97706",
      bodyColor: "#fff6d6",
      cardColor: "#fffaf0",
      modalColor: "#fffaf0",
      popoverColor: "#ffffff",
      borderColor: "rgba(120,80,20,0.12)",
      borderRadius: "8px",
    },
  },
},
```

Note: `lightTokens` merges defaults then `partial`; if `text` is in defaults, spreading `partial` last already overrides when passed in `partial` — ensure helper allows extra keys via `Partial<...>`.

- [ ] **Step 2: Append `moss-forest` skin definition**

```ts
{
  id: "moss-forest",
  name: "青苔森野",
  description: "林雾壁纸 · 松绿磨砂壳",
  mode: "dark",
  layout: "desktop",
  preview: ["#0f1a14", "#3d8f6a", "#1a2e24"],
  wallpaper: {
    type: "image",
    src: "/skins/moss-forest/bg.png",
    fallback:
      "linear-gradient(165deg, #0a1410 0%, #152820 50%, #0f1a14 100%)",
  },
  overlay:
    "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 35%, rgba(0,0,0,0.35) 100%)",
  tokens: darkTokens({
    bg: "#0f1a14",
    "sider-bg": "rgba(8,16,12,0.55)",
    "bar-bg": "rgba(12,22,16,0.55)",
    primary: "#3d8f6a",
    "primary-hover": "#4eab80",
    "primary-pressed": "#2f7355",
    "primary-soft": "rgba(61,143,106,0.18)",
    "accent-secondary": "#7bc4a0",
    "panel-blur": "16px",
  }),
  naiveOverrides: {
    common: {
      primaryColor: "#3d8f6a",
      primaryColorHover: "#4eab80",
      primaryColorPressed: "#2f7355",
      primaryColorSuppl: "#3d8f6a",
      bodyColor: "#0f1a14",
      cardColor: "#15241c",
      modalColor: "#15241c",
      popoverColor: "#1a2e24",
      borderColor: "rgba(255,255,255,0.08)",
      borderRadius: "8px",
    },
  },
},
```

- [ ] **Step 3: Typecheck**

Run: `pnpm typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/themes/registry.ts
git commit -m "feat(themes): add honey-pop and moss-forest image skins"
```

---

### Task 7: Skin picker / theme window / settings copy

**Files:**
- Modify: `src/components/SkinPicker.vue`
- Modify: `src/views/ThemeWindow.vue`
- Modify: `src/views/SettingsWindow.vue`

- [ ] **Step 1: Preview helper for wallpaper**

In `SkinPicker.vue` script, add:

```ts
import type { SkinDefinition } from "../themes/types";

function previewStyle(skin: SkinDefinition): Record<string, string> {
  if (skin.wallpaper.type === "image") {
    return {
      backgroundImage: `url("${skin.wallpaper.src}")`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return {
    background: skin.wallpaper.value,
  };
}
```

In template, replace the inline gradient style on `.skin-preview` with:

```vue
<div class="skin-preview" :style="previewStyle(skin)">
```

Keep chips / mode badge.

- [ ] **Step 2: Same preview in ThemeWindow.vue**

ThemeWindow currently inlines gradient from `skin.preview`. Mirror the same `previewStyle` helper (duplicate small function is OK; do not invent a shared util unless one already exists).

- [ ] **Step 3: Settings hint**

In `SettingsWindow.vue`, change the hint near 主题皮肤 from:

`皮肤只改变配色，不影响窗口布局。`

to:

`更换整窗皮肤：壁纸、磨砂侧栏与播放条一并切换，布局不变。`

- [ ] **Step 4: Typecheck + commit**

```bash
pnpm typecheck
git add src/components/SkinPicker.vue src/views/ThemeWindow.vue src/views/SettingsWindow.vue
git commit -m "feat(themes): skin previews for CSS and image wallpapers"
```

---

### Task 8: Manual verification + polish

**Files:** only fix regressions found

- [ ] **Step 1: Run typecheck once more**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 2: Dev visual checklist** (run `pnpm tauri dev` or `pnpm dev` as project usual)

Check:

1. Default obsidian: full-window CSS atmosphere, frosted sidebar/player, no white list cards.
2. Cycle all six base skins: wallpaper + chrome change together.
3. `honey-pop`: image cover, readable text, yellow primary.
4. `moss-forest`: image cover, forest primary, frosted green-black chrome.
5. Theme window selection persists after restart (`skinId` in localStorage).
6. Settings / theme subwindows remain usable (solid or token bg OK).
7. Track list hover/active still visible on both light and dark image skins.

- [ ] **Step 3: Fix any blocking issues (opacity/blur/text contrast)**

If light image skin is unreadable: raise `sider-bg`/`bar-bg` opacity toward `0.7` or strengthen `overlay`.

- [ ] **Step 4: Final commit if polish changes**

```bash
git add -A
git commit -m "fix(themes): polish skin contrast and shell transparency"
```

(Skip empty commit if nothing to fix.)

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Full-window wallpaper layer | 2, 3 |
| CSS + image wallpaper model | 1, 2, 6 |
| Frosted sidebar / title / player | 3, 4 |
| Transparent lists, no white cards | 3, 4 |
| Six base skins CSS upgrade | 4 |
| honey-pop image cute yellow | 5, 6 |
| moss-forest image forest | 5, 6 |
| Picker preview | 7 |
| Settings copy | 7 |
| No custom upload / layout change | out of scope |
| Compat resolveSkinId / legacy map | unchanged Task 2 |

---

## Notes for implementers

- **Do not** reintroduce solid `app-main { background: var(--bg) !important }` on the main shell.
- Image paths must start with `/skins/...` so Vite serves from `public/`.
- `backdrop-filter` needs a non-opaque ancestor chain; wallpaper is on `::before` under the shell — chrome panels are children with translucent backgrounds, so blur samples the wallpaper. Avoid `isolation` tricks that create empty backdrops on the wrong element.
- Keep commits per task as listed for easy review/revert.
