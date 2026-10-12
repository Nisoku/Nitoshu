import { effect } from "@nisoku/sairin";
import {
  applySettings,
  snapshotSettings,
  type Settings,
} from "../state/settings";
import {
  restoreDocuments,
  snapshotDocuments,
  type DocumentsSnapshot,
} from "../state/documents";
import {
  restoreRecent,
  recentFiles,
  type RecentFile,
} from "../state/recent";
import { readJson, writeJson } from "./local";

const SETTINGS_KEY = "settings";
const DOCUMENTS_KEY = "documents";
const RECENT_KEY = "recent";
const DOCUMENTS_DEBOUNCE_MS = 400;

export function loadSettings(): void {
  applySettings(readJson<Partial<Settings>>(SETTINGS_KEY, {}));
}

export function watchSettings(): () => void {
  return effect(() => {
    writeJson(SETTINGS_KEY, snapshotSettings());
  });
}

export function loadDocuments(): void {
  const snapshot = readJson<DocumentsSnapshot | null>(DOCUMENTS_KEY, null);
  if (snapshot !== null && Array.isArray(snapshot.documents)) {
    restoreDocuments(snapshot);
  }
}

export function watchDocuments(): () => void {
  let timer: number | undefined;
  return effect(() => {
    const snapshot = snapshotDocuments();
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = undefined;
      writeJson(DOCUMENTS_KEY, snapshot);
    }, DOCUMENTS_DEBOUNCE_MS);
  });
}

export function loadRecent(): void {
  const files = readJson<RecentFile[]>(RECENT_KEY, []);
  if (Array.isArray(files)) {
    restoreRecent(files);
  }
}

export function watchRecent(): () => void {
  return effect(() => {
    writeJson(RECENT_KEY, recentFiles.get());
  });
}
