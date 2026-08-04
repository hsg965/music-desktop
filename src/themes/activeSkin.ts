import { shallowRef, type ShallowRef } from "vue";
import type { SkinDefinition } from "./types";

/** 当前已应用到 document 的皮肤（供 WallpaperLayer 等订阅） */
export const activeSkin: ShallowRef<SkinDefinition | null> = shallowRef(null);
