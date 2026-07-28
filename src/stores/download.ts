import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { Bitrate, Track } from "../types/music";
import { fetchPlayUrl } from "../api/music";

export type DownloadStatus =
  | "pending"
  | "downloading"
  | "done"
  | "failed"
  | "cancelled";

export interface DownloadTask {
  id: string;
  track: Track;
  br: Bitrate;
  path: string;
  status: DownloadStatus;
  error?: string;
  createdAt: number;
  finishedAt?: number;
}

function taskId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useDownloadStore = defineStore("download", () => {
  const tasks = ref<DownloadTask[]>([]);
  const processing = ref(false);

  const activeCount = computed(
    () =>
      tasks.value.filter(
        (t) => t.status === "pending" || t.status === "downloading",
      ).length,
  );

  const pendingCount = computed(
    () => tasks.value.filter((t) => t.status === "pending").length,
  );

  function enqueue(track: Track, br: Bitrate, path: string) {
    const task: DownloadTask = {
      id: taskId(),
      track: { ...track },
      br,
      path,
      status: "pending",
      createdAt: Date.now(),
    };
    tasks.value.unshift(task);
    void pump();
    return task.id;
  }

  async function pump() {
    if (processing.value) return;
    processing.value = true;
    try {
      while (true) {
        const next = tasks.value.find((t) => t.status === "pending");
        if (!next) break;
        await runTask(next);
      }
    } finally {
      processing.value = false;
    }
  }

  async function runTask(task: DownloadTask) {
    task.status = "downloading";
    task.error = undefined;
    try {
      const urlRes = await fetchPlayUrl(task.track.id, task.track.source, task.br);
      if (!urlRes?.url) {
        throw new Error("无法获取下载地址（可能无版权或音源不可用）");
      }
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("download_file", {
        url: urlRes.url,
        path: task.path,
      });
      task.status = "done";
      task.finishedAt = Date.now();
    } catch (e) {
      task.status = "failed";
      task.error = e instanceof Error ? e.message : String(e);
      task.finishedAt = Date.now();
    }
  }

  function retry(id: string) {
    const task = tasks.value.find((t) => t.id === id);
    if (!task) return;
    if (task.status !== "failed" && task.status !== "cancelled") return;
    task.status = "pending";
    task.error = undefined;
    task.finishedAt = undefined;
    void pump();
  }

  function remove(id: string) {
    const idx = tasks.value.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const t = tasks.value[idx];
    if (t.status === "downloading") return; // 进行中不删
    tasks.value.splice(idx, 1);
  }

  function clearFinished() {
    tasks.value = tasks.value.filter(
      (t) => t.status === "pending" || t.status === "downloading",
    );
  }

  function clearAll() {
    tasks.value = tasks.value.filter((t) => t.status === "downloading");
  }

  return {
    tasks,
    processing,
    activeCount,
    pendingCount,
    enqueue,
    retry,
    remove,
    clearFinished,
    clearAll,
  };
});
