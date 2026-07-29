/** 多窗口管理：迷你播放器 / 桌面歌词 */

export async function openMiniPlayer() {
  try {
    const { WebviewWindow, getAllWebviewWindows } = await import(
      "@tauri-apps/api/webviewWindow"
    );
    const existing = (await getAllWebviewWindows()).find((w) => w.label === "mini");
    if (existing) {
      await existing.show();
      await existing.setFocus();
      return existing;
    }
    const win = new WebviewWindow("mini", {
      url: "/#/mini",
      title: "迷你播放器",
      width: 320,
      height: 120,
      decorations: false,
      alwaysOnTop: true,
      resizable: false,
      skipTaskbar: true,
      transparent: false,
      center: false,
      x: 40,
      y: 40,
    });
    return win;
  } catch (e) {
    console.warn("openMiniPlayer failed", e);
    return null;
  }
}

export async function openDesktopLyric() {
  try {
    const { WebviewWindow, getAllWebviewWindows } = await import(
      "@tauri-apps/api/webviewWindow"
    );
    const existing = (await getAllWebviewWindows()).find((w) => w.label === "lyric");
    if (existing) {
      await existing.show();
      await existing.setFocus();
      return existing;
    }
    const win = new WebviewWindow("lyric", {
      url: "/#/lyric",
      title: "桌面歌词",
      width: 560,
      height: 128,
      minWidth: 360,
      minHeight: 100,
      decorations: false,
      alwaysOnTop: true,
      resizable: true,
      skipTaskbar: true,
      transparent: true,
      shadow: false,
      center: true,
    });
    return win;
  } catch (e) {
    console.warn("openDesktopLyric failed", e);
    return null;
  }
}

/** 独立主题选择窗口 */
export async function openThemePicker() {
  try {
    const { WebviewWindow, getAllWebviewWindows } = await import(
      "@tauri-apps/api/webviewWindow"
    );
    const existing = (await getAllWebviewWindows()).find((w) => w.label === "theme");
    if (existing) {
      await existing.show();
      await existing.unminimize();
      await existing.setFocus();
      return existing;
    }
    const win = new WebviewWindow("theme", {
      url: "/#/theme",
      title: "主题皮肤",
      width: 720,
      height: 560,
      minWidth: 560,
      minHeight: 420,
      decorations: false,
      resizable: true,
      center: true,
      transparent: false,
    });
    return win;
  } catch (e) {
    console.warn("openThemePicker failed", e);
    return null;
  }
}

export async function closeWindowByLabel(label: string) {
  try {
    const { getAllWebviewWindows } = await import("@tauri-apps/api/webviewWindow");
    const win = (await getAllWebviewWindows()).find((w) => w.label === label);
    if (win) await win.close();
  } catch {
    // ignore
  }
}
