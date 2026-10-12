import { derived, path, signal } from "@nisoku/sairin";
import { activeDirty } from "./documents";

export const READY_STATUS = "Ready";
export const UNSAVED_STATUS = "Unsaved changes";

const actionStatus = signal(path("ui", "actionStatus"), "");

export const status = derived(path("ui", "status"), () => {
  const action = actionStatus.get();
  if (action !== "") {
    return action;
  }
  return activeDirty.get() ? UNSAVED_STATUS : READY_STATUS;
});

let statusResetTimer: number | undefined;

function clearResetTimer(): void {
  if (statusResetTimer !== undefined) {
    window.clearTimeout(statusResetTimer);
    statusResetTimer = undefined;
  }
}

export function flashStatus(message: string, durationMs = 2000): void {
  clearResetTimer();
  actionStatus.set(message);
  statusResetTimer = window.setTimeout(() => {
    statusResetTimer = undefined;
    actionStatus.set("");
  }, durationMs);
}
