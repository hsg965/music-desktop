import { getSkin, DEFAULT_SKIN_ID, applySkinToDocument } from "./registry";
import type { SkinId, SkinDefinition } from "./types";

export function resolveSkinId(id?: string | null): SkinId {
  if (!id) return DEFAULT_SKIN_ID;
  const skin = getSkin(id);
  return skin.id;
}

export function applySkin(id?: string | null): SkinDefinition {
  const skin = getSkin(resolveSkinId(id));
  if (typeof document !== "undefined") {
    applySkinToDocument(skin);
  }
  return skin;
}

export { getSkin, DEFAULT_SKIN_ID };
export type { SkinId, SkinDefinition };
