export interface LyricLine {
  time: number;
  text: string;
}

/** 解析 LRC 文本 */
export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc?.trim()) return [];

  const lines: LyricLine[] = [];
  const rowRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of lrc.split(/\r?\n/)) {
    const text = raw.replace(rowRe, "").trim();
    let m: RegExpExecArray | null;
    rowRe.lastIndex = 0;
    while ((m = rowRe.exec(raw)) !== null) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      const frac = m[3] || "0";
      const ms =
        frac.length === 1
          ? Number(frac) * 100
          : frac.length === 2
            ? Number(frac) * 10
            : Number(frac.padEnd(3, "0").slice(0, 3));
      const time = min * 60 + sec + ms / 1000;
      lines.push({ time, text });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/** 根据当前时间取歌词行索引 */
export function findLyricIndex(lines: LyricLine[], time: number): number {
  if (!lines.length) return -1;
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= time + 0.15) idx = i;
    else break;
  }
  return idx;
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
