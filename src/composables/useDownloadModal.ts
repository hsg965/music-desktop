import { inject, provide, ref, type InjectionKey, type Ref } from "vue";
import type { Track } from "../types/music";

export interface DownloadModalApi {
  show: Ref<boolean>;
  track: Ref<Track | null>;
  open: (t: Track) => void;
}

const KEY: InjectionKey<DownloadModalApi> = Symbol("downloadModal");

export function provideDownloadModal(): DownloadModalApi {
  const show = ref(false);
  const track = ref<Track | null>(null);
  function open(t: Track) {
    track.value = t;
    show.value = true;
  }
  const api = { show, track, open };
  provide(KEY, api);
  return api;
}

export function useDownloadModal(): DownloadModalApi {
  const api = inject(KEY);
  if (!api) {
    // 兜底：局部实例（测试/独立使用）
    const show = ref(false);
    const track = ref<Track | null>(null);
    return {
      show,
      track,
      open: (t: Track) => {
        track.value = t;
        show.value = true;
      },
    };
  }
  return api;
}
