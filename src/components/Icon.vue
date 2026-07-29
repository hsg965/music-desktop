<script setup lang="ts">
import { Icon as IconifyIcon, addCollection } from "@iconify/vue";
import { computed } from "vue";
// 包入口导出 IconifyJSON，避免 json 路径在 pnpm/vite 下解析失败
import { icons as riIcons } from "@iconify-json/ri";

addCollection(riIcons);

const props = withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    color?: string;
  }>(),
  {
    size: 18,
  },
);

const iconStyle = computed(() =>
  props.color ? { color: props.color } : undefined,
);
</script>

<template>
  <IconifyIcon
    :icon="name.startsWith('ri:') ? name : `ri:${name}`"
    :width="size"
    :height="size"
    :style="iconStyle"
    class="inline-block shrink-0 align-middle"
  />
</template>
