import {
  getSkin,
  DEFAULT_SKIN_ID,
  applySkinToDocument,
  resolveSkinId,
} from "./registry";
import type { SkinId, SkinDefinition } from "./types";

export function applySkin(id?: string | null): SkinDefinition {
  const skin = getSkin(resolveSkinId(id));
  if (typeof document !== "undefined") {
    applySkinToDocument(skin);
  }
  return skin;
}

export { getSkin, DEFAULT_SKIN_ID, resolveSkinId };
export type { SkinId, SkinDefinition };
