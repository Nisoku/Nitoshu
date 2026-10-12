import { batch, derived, path, signal } from "@nisoku/sairin";
import { formatCharacterCount } from "../utils/format";

export const DEFAULT_FILENAME = "Untitled.txt";
export const READY_STATUS = "Ready";

export const paths = {
  content: path("document", "content"),
  filename: path("document", "filename"),
  dirty: path("document", "dirty"),
  characterCount: path("document", "characterCount"),
  characterCountLabel: path("document", "characterCountLabel"),
  status: path("ui", "status"),
} as const;

export const content = signal(paths.content, "");
export const filename = signal(paths.filename, DEFAULT_FILENAME);
export const dirty = signal(paths.dirty, false);
export const status = signal(paths.status, READY_STATUS);

export const characterCount = derived(paths.characterCount, () =>
  content.get().length,
);

export const characterCountLabel = derived(paths.characterCountLabel, () =>
  formatCharacterCount(characterCount.get()),
);

let statusResetTimer: number | undefined;

export function setContent(value: string): void {
  content.set(value);
  dirty.set(true);
}

export function loadDocument(value: string, name: string): void {
  batch(() => {
    content.set(value);
    filename.set(name);
    dirty.set(false);
  });
}

export function markSaved(name: string): void {
  batch(() => {
    filename.set(name);
    dirty.set(false);
  });
}

export function setStatus(message: string): void {
  if (statusResetTimer !== undefined) {
    window.clearTimeout(statusResetTimer);
    statusResetTimer = undefined;
  }
  status.set(message);
}

export function flashStatus(
  message: string,
  resetTo: string = READY_STATUS,
  durationMs = 2000,
): void {
  setStatus(message);
  statusResetTimer = window.setTimeout(() => {
    statusResetTimer = undefined;
    status.set(resetTo);
  }, durationMs);
}
