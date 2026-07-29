export interface LyricWord {
  time: number;
  text: string;
}

export interface LyricLine {
  time: number;
  text: string;
  /** 逐字/逐词时间轴（增强 LRC 或按行时长均分） */
  words?: LyricWord[];
}

function parseTimestamp(min: string, sec: string, frac?: string): number {
  const f = frac || "0";
  const ms =
    f.length === 1
      ? Number(f) * 100
      : f.length === 2
        ? Number(f) * 10
        : Number(f.padEnd(3, "0").slice(0, 3));
  return Number(min) * 60 + Number(sec) + ms / 1000;
}

/** 解析行内增强 LRC：...&lt;mm:ss.xx&gt;字 */
function parseInlineWords(rawText: string, lineTime: number): {
  text: string;
  words?: LyricWord[];
} {
  const wordRe = /<(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?>/g;
  if (!wordRe.test(rawText)) {
    return { text: rawText.trim() };
  }

  const words: LyricWord[] = [];
  // 形如: 前缀可选 + <t>字<t>字
  const parts = rawText.split(/<(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?>/);
  // split 会把捕获组插进结果: [before, m, s, f, text, m, s, f, text, ...]
  if (parts[0]?.trim()) {
    words.push({ time: lineTime, text: parts[0] });
  }
  for (let i = 1; i + 3 < parts.length; i += 4) {
    const t = parseTimestamp(parts[i], parts[i + 1], parts[i + 2]);
    const text = parts[i + 3] ?? "";
    if (text.length) words.push({ time: t, text });
  }
  const text = words.map((w) => w.text).join("");
  return { text, words: words.length ? words : undefined };
}

/** 解析 LRC 文本 */
export function parseLrc(lrc: string): LyricLine[] {
  if (!lrc?.trim()) return [];

  const lines: LyricLine[] = [];
  const rowRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of lrc.split(/\r?\n/)) {
    const timestamps: number[] = [];
    let m: RegExpExecArray | null;
    rowRe.lastIndex = 0;
    while ((m = rowRe.exec(raw)) !== null) {
      timestamps.push(parseTimestamp(m[1], m[2], m[3]));
    }
    if (!timestamps.length) continue;

    const rawText = raw.replace(rowRe, "").trim();
    if (!rawText) {
      for (const time of timestamps) {
        lines.push({ time, text: "" });
      }
      continue;
    }

    for (const time of timestamps) {
      const parsed = parseInlineWords(rawText, time);
      lines.push({
        time,
        text: parsed.text,
        words: parsed.words,
      });
    }
  }

  return lines.sort((a, b) => a.time - b.time);
}

/**
 * 根据当前时间取歌词行索引
 * @param lookAhead 提前量（秒）。普通 LRC 时间戳是「开唱点」，略提前显示才跟得上读
 */
export function findLyricIndex(
  lines: LyricLine[],
  time: number,
  lookAhead = 0.85,
): number {
  if (!lines.length) return -1;
  let idx = -1;
  const t = time + lookAhead;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= t) idx = i;
    else break;
  }
  return idx;
}

/**
 * 将一行拆成显示单元：中文按字，英文按词
 */
export function splitLyricUnits(text: string): string[] {
  if (!text) return [];
  // 含中日韩时按字
  if (/[\u3040-\u30ff\u3400-\u9fff\uf900-\ufaff]/.test(text)) {
    return Array.from(text);
  }
  // 英文等按单词保留空格
  return text.split(/(\s+)/).filter((s) => s.length > 0);
}

/**
 * 当前行逐字进度：已唱到第几个 unit（含）
 * 有 words 时间轴用真实时间；否则在 [本行, 下一行) 内均分
 */
export function getActiveUnitIndex(
  lines: LyricLine[],
  lineIndex: number,
  currentTime: number,
  songDuration = 0,
): number {
  if (lineIndex < 0 || lineIndex >= lines.length) return -1;
  const line = lines[lineIndex];
  const units = line.words?.length
    ? line.words.map((w) => w.text)
    : splitLyricUnits(line.text);
  if (!units.length) return -1;

  // 增强 LRC 逐词
  if (line.words?.length) {
    let idx = -1;
    for (let i = 0; i < line.words.length; i++) {
      if (line.words[i].time <= currentTime + 0.05) idx = i;
      else break;
    }
    return idx;
  }

  // 普通 LRC：按行时长均分到每个字/词
  const start = line.time;
  const next = lines[lineIndex + 1];
  const end = next
    ? next.time
    : songDuration > start
      ? songDuration
      : start + Math.max(2.5, units.length * 0.35);
  const span = Math.max(0.35, end - start);
  const ratio = Math.min(1, Math.max(0, (currentTime - start) / span));
  // 略超前一点更跟唱
  const idx = Math.floor(ratio * units.length + 0.001);
  return Math.min(units.length - 1, Math.max(-1, idx));
}

export function getLineUnits(line: LyricLine | undefined): string[] {
  if (!line) return [];
  if (line.words?.length) return line.words.map((w) => w.text);
  return splitLyricUnits(line.text);
}

export function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
