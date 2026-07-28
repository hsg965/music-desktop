<script setup lang="ts">
import { ref, watch } from "vue";
import { NButton, NModal, NRadio, NRadioGroup, NSpace, useMessage } from "naive-ui";
import { BITRATE_OPTIONS } from "../api/music";
import type { Bitrate, Track } from "../types/music";
import { useSettingsStore } from "../stores/settings";
import { useDownloadStore } from "../stores/download";
import { pickSavePath } from "../utils/download";

const props = defineProps<{
  show: boolean;
  track: Track | null;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

const settings = useSettingsStore();
const downloadStore = useDownloadStore();
const message = useMessage();
const br = ref<Bitrate>(settings.bitrate);
const picking = ref(false);

watch(
  () => props.show,
  (v) => {
    if (v) {
      br.value = settings.bitrate;
      picking.value = false;
    }
  },
);

function close() {
  if (picking.value) return;
  emit("update:show", false);
}

async function confirm() {
  if (!props.track || picking.value) return;
  picking.value = true;
  try {
    const path = await pickSavePath(props.track, br.value);
    if (!path) {
      message.info("已取消");
      return;
    }
    // 先关弹窗，后台进下载列表
    emit("update:show", false);
    downloadStore.enqueue(props.track, br.value, path);
    message.success("已加入下载列表");
  } catch (e) {
    message.error(e instanceof Error ? e.message : "无法选择保存路径");
  } finally {
    picking.value = false;
  }
}

function artistText(t: Track) {
  return (t.artist || []).join(" / ") || "未知歌手";
}
</script>

<template>
  <NModal
    :show="show"
    preset="card"
    title="下载歌曲"
    style="width: 420px"
    :mask-closable="!picking"
    :closable="!picking"
    @update:show="(v: boolean) => !picking && emit('update:show', v)"
  >
    <div v-if="track" class="space-y-4">
      <div>
        <div class="text-base text-white/90 font-medium">{{ track.name }}</div>
        <div class="text-sm text-white/45 mt-1">{{ artistText(track) }}</div>
      </div>

      <div>
        <div class="text-sm text-white/65 mb-2">选择音质</div>
        <NRadioGroup v-model:value="br" :disabled="picking">
          <NSpace vertical>
            <NRadio
              v-for="opt in BITRATE_OPTIONS"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </NSpace>
        </NRadioGroup>
        <div class="text-xs text-white/30 mt-2">
          确认后选择保存位置，任务进入下载列表后台执行
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <NButton :disabled="picking" @click="close">取消</NButton>
        <NButton type="primary" :loading="picking" @click="confirm">
          加入下载
        </NButton>
      </div>
    </template>
  </NModal>
</template>
