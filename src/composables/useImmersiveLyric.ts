import { ref } from "vue";

/** 全局沉浸式歌词开关（播放条与主窗共享） */
const open = ref(false);

export function useImmersiveLyric() {
  function show() {
    open.value = true;
  }
  function hide() {
    open.value = false;
  }
  function toggle() {
    open.value = !open.value;
  }
  return { open, show, hide, toggle };
}
