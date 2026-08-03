<script setup lang="ts">
import { SKINS } from "../themes/registry";
import type { SkinDefinition, SkinId } from "../themes/types";
import { useSettingsStore } from "../stores/settings";

const settings = useSettingsStore();

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
}
</script>

<template>
  <div class="skin-grid">
    <button
      v-for="skin in SKINS"
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
          {{ skin.mode === "light" ? "浅色" : "深色" }}
        </span>
      </div>
      <div class="skin-meta">
        <div class="skin-name">{{ skin.name }}</div>
        <div class="skin-desc">{{ skin.description }}</div>
      </div>
    </button>
  </div>
</template>

<style scoped>
.skin-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.skin-card {
  text-align: left;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--bar-bg) 88%, transparent);
  backdrop-filter: blur(calc(var(--panel-blur) * 0.5));
  -webkit-backdrop-filter: blur(calc(var(--panel-blur) * 0.5));
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
  box-shadow: var(--glow), 0 0 0 1px var(--primary);
}

.skin-preview {
  height: 72px;
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.35);
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
  background: rgba(255, 255, 255, 0.75);
  color: #333;
}

.skin-meta {
  padding: 10px 12px 12px;
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
</style>
