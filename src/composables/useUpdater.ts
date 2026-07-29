import { computed, ref } from "vue";
import type { Update } from "@tauri-apps/plugin-updater";

/** GitHub Releases 页面（手动下载兜底） */
export const GITHUB_RELEASES_URL =
  "https://github.com/hsg965/music-desktop/releases";

export type UpdaterPhase =
  | "idle"
  | "checking"
  | "available"
  | "up-to-date"
  | "downloading"
  | "installing"
  | "error";

const phase = ref<UpdaterPhase>("idle");
const currentVersion = ref("");
const availableVersion = ref("");
const releaseNotes = ref("");
const errorMessage = ref("");
const downloadPercent = ref<number | null>(null);
const dialogVisible = ref(false);

/** 静默检查时若无更新则不弹窗 */
let pendingUpdate: Update | null = null;
let startedSilent = false;

export function useUpdater() {
  const isBusy = computed(
    () =>
      phase.value === "checking" ||
      phase.value === "downloading" ||
      phase.value === "installing",
  );

  async function loadCurrentVersion() {
    if (currentVersion.value) return currentVersion.value;
    try {
      const { getVersion } = await import("@tauri-apps/api/app");
      currentVersion.value = await getVersion();
    } catch {
      currentVersion.value = "dev";
    }
    return currentVersion.value;
  }

  async function openGitHubReleases() {
    try {
      const { openUrl } = await import("@tauri-apps/plugin-opener");
      await openUrl(GITHUB_RELEASES_URL);
    } catch {
      window.open(GITHUB_RELEASES_URL, "_blank");
    }
  }

  function resetToIdle() {
    if (phase.value === "downloading" || phase.value === "installing") return;
    phase.value = "idle";
    errorMessage.value = "";
    downloadPercent.value = null;
  }

  function closeDialog() {
    if (isBusy.value && phase.value !== "checking") return;
    dialogVisible.value = false;
    if (phase.value === "up-to-date" || phase.value === "error") {
      resetToIdle();
    }
  }

  /**
   * @param silent 为 true 时：仅有新版本才弹窗；失败静默（不打扰）
   */
  async function checkForUpdate(silent = false) {
    if (isBusy.value) return;

    phase.value = "checking";
    errorMessage.value = "";
    availableVersion.value = "";
    releaseNotes.value = "";
    downloadPercent.value = null;
    pendingUpdate = null;

    if (!silent) {
      dialogVisible.value = true;
    }

    try {
      await loadCurrentVersion();
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (!update) {
        phase.value = "up-to-date";
        if (!silent) dialogVisible.value = true;
        else {
          phase.value = "idle";
        }
        return;
      }

      pendingUpdate = update;
      availableVersion.value = update.version;
      releaseNotes.value = (update.body ?? "").trim();
      phase.value = "available";
      dialogVisible.value = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      phase.value = "error";
      errorMessage.value = msg || "检查更新失败";
      if (!silent) {
        dialogVisible.value = true;
      } else {
        // 启动静默检查失败不打扰用户
        phase.value = "idle";
        errorMessage.value = "";
      }
    }
  }

  async function downloadAndInstall() {
    if (!pendingUpdate || isBusy.value) return;
    if (phase.value !== "available") return;

    phase.value = "downloading";
    downloadPercent.value = 0;
    errorMessage.value = "";

    try {
      let contentLength: number | undefined;
      let downloaded = 0;

      await pendingUpdate.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength;
            downloaded = 0;
            downloadPercent.value = contentLength ? 0 : null;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength && contentLength > 0) {
              downloadPercent.value = Math.min(
                99,
                Math.round((downloaded / contentLength) * 100),
              );
            }
            break;
          case "Finished":
            phase.value = "installing";
            downloadPercent.value = 100;
            break;
        }
      });

      phase.value = "installing";
      const { relaunch } = await import("@tauri-apps/plugin-process");
      await relaunch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      phase.value = "error";
      errorMessage.value = msg || "下载或安装失败";
      downloadPercent.value = null;
      // 保留 pendingUpdate，用户可重试或手动下载
    }
  }

  /** 主窗口启动后延迟静默检查（仅一次） */
  function scheduleSilentCheck(delayMs = 4000) {
    if (startedSilent) return;
    startedSilent = true;
    window.setTimeout(() => {
      void checkForUpdate(true);
    }, delayMs);
  }

  return {
    phase,
    currentVersion,
    availableVersion,
    releaseNotes,
    errorMessage,
    downloadPercent,
    dialogVisible,
    isBusy,
    loadCurrentVersion,
    checkForUpdate,
    downloadAndInstall,
    openGitHubReleases,
    closeDialog,
    scheduleSilentCheck,
    GITHUB_RELEASES_URL,
  };
}
