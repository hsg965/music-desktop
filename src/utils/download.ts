import type { Bitrate, Track } from "../types/music";

const ILLEGAL = /[\\/:*?"<>|]/g;

export function sanitizeFileName(name: string): string {
  return name.replace(ILLEGAL, "_").replace(/\s+/g, " ").trim() || "未命名";
}

export function guessExtFromUrl(url: string, br: Bitrate): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    const m = path.match(/\.(mp3|flac|m4a|aac|ogg|wav|ape)(?:$|\?)/i);
    if (m) return m[1].toLowerCase();
  } catch {
    // ignore
  }
  return br >= 740 ? "flac" : "mp3";
}

export function buildDefaultFileName(track: Track, br: Bitrate, url?: string): string {
  const artist = (track.artist || []).join("、") || "未知歌手";
  const base = sanitizeFileName(`${artist} - ${track.name}`);
  const ext = url ? guessExtFromUrl(url, br) : br >= 740 ? "flac" : "mp3";
  return `${base}.${ext}`;
}

/** 弹出另存为，返回路径；取消返回 null */
export async function pickSavePath(track: Track, br: Bitrate): Promise<string | null> {
  const defaultName = buildDefaultFileName(track, br);
  const { save } = await import("@tauri-apps/plugin-dialog");
  const path = await save({
    title: "保存音乐",
    defaultPath: defaultName,
    filters: [
      {
        name: "音频",
        extensions: ["mp3", "flac", "m4a", "aac", "ogg", "wav"],
      },
      { name: "全部文件", extensions: ["*"] },
    ],
  });
  return path || null;
}
