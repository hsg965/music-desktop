<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { NButton, NRadioButton, NRadioGroup } from "naive-ui";
import { SKINS } from "../themes/registry";
import type { SkinDefinition, SkinId, SkinMode } from "../themes/types";
import { useSettingsStore } from "../stores/settings";
import Icon from "../components/Icon.vue";
import { applySkin } from "../themes/apply";

const settings = useSettingsStore();
const filter = ref<"all" | SkinMode>("all");

const list = computed(() => {
  if (filter.value === "all") return SKINS;
  return SKINS.filter((s) => s.mode === filter.value);
});

const lightCount = computed(() => SKINS.filter((s) => s.mode === "light").length);
const darkCount = computed(() => SKINS.filter((s) => s.mode === "dark").length);

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

function select(id: SkinId) {
  settings.setSkin(id);
  // 主题窗自身立刻应用
  applySkin(id);
}

async function closeWin() {
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch {
    // ignore
  }
}

onMounted(() => {
  applySkin(settings.skinId);
});
</script>

<template>
  <div class="theme-win">
    <header class="top" data-tauri-drag-region>
      <div class="title" data-tauri-drag-region>
        <Icon name="ri:palette-fill" :size="18" color="var(--primary)" />
        <span>主题皮肤</span>
        <span class="count">共 {{ SKINS.length }} 套</span>
      </div>
      <button type="button" class="close-btn" title="关闭" @click="closeWin">
        <Icon name="ri:close-line" :size="16" />
      </button>
    </header>

    <div class="toolbar">
      <NRadioGroup v-model:value="filter" size="small">
        <NRadioButton value="all">全部 ({{ SKINS.length }})</NRadioButton>
        <NRadioButton value="light">亮色 ({{ lightCount }})</NRadioButton>
        <NRadioButton value="dark">深色 ({{ darkCount }})</NRadioButton>
      </NRadioGroup>
      <div class="current">
        当前：
        <b>{{ SKINS.find((s) => s.id === settings.skinId)?.name || settings.skinId }}</b>
      </div>
    </div>

    <div class="grid-wrap">
      <div class="skin-grid">
        <button
          v-for="skin in list"
          :key="skin.id"
          type="button"
          class="skin-card"
          :class="{ active: settings.skinId === skin.id }"
          @click="select(skin.id)"
        >
          <div class="skin-preview" :style="previewStyle(skin)">
            <span class="skin-chip" :style="{ background: skin.preview[1] }" />
            <span class="skin-chip" :style="{ background: skin.preview[2] }" />
            <span
              class="skin-mode"
              :class="skin.mode === 'light' ? 'is-light' : 'is-dark'"
            >
              {{ skin.mode === "light" ? "亮色" : "深色" }}
            </span>
            <span v-if="settings.skinId === skin.id" class="check">
              <Icon name="ri:check-line" :size="14" />
            </span>
          </div>
          <div class="skin-meta">
            <div class="skin-name">{{ skin.name }}</div>
            <div class="skin-desc">{{ skin.description }}</div>
          </div>
        </button>
      </div>
    </div>

    <footer class="bottom">
      <span class="hint">点击即可切换，主窗口会同步应用</span>
      <NButton size="small" type="primary" @click="closeWin">完成</NButton>
    </footer>
  </div>
</template>

<style scoped>
.theme-win {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-grad, var(--bg));
  color: var(--text);
  overflow: hidden;
}

.top {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.count {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-faint);
  margin-left: 4px;
}

.close-btn {
  width: 32px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover {
  background: #e81123;
  color: #fff;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px 8px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.current {
  font-size: 12px;
  color: var(--text-muted);
}
.current b {
  color: var(--primary);
  font-weight: 600;
}

.grid-wrap {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 8px 16px 12px;
}

.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 12px;
}

.skin-card {
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius-md, 12px);
  background: var(--surface);
  overflow: hidden;
  cursor: pointer;
  padding: 0;
  color: inherit;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    transform 0.15s;
}

.skin-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-1px);
}

.skin-card.active {
  border-color: var(--primary);
  box-shadow: 0 0 0 1px var(--primary), var(--glow);
}

.skin-preview {
  height: 76px;
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  padding: 10px;
}

.skin-chip {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.skin-mode {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}

.skin-mode.is-light {
  background: rgba(255, 255, 255, 0.82);
  color: #333;
}

.check {
  position: absolute;
  left: 8px;
  top: 8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.skin-meta {
  padding: 10px 12px 12px;
  background: var(--bar-bg);
}

.skin-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.skin-desc {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-faint);
}

.bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  background: var(--bar-bg);
  flex-shrink: 0;
}

.hint {
  font-size: 12px;
  color: var(--text-faint);
}
</style>
