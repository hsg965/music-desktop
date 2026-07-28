<script setup lang="ts">
import { Icon as IconifyIcon } from "@iconify/vue";

withDefaults(
  defineProps<{
    name: string;
    size?: number | string;
    color?: string;
  }>(),
  {
    size: 18,
    color: "currentColor",
  },
);
</script>

<template>
  <IconifyIcon
    :icon="name.startsWith('ri:') ? name : `ri:${name}`"
    :width="size"
    :height="size"
    :style="{ color }"
    class="inline-block shrink-0 align-middle"
  />
</template>
