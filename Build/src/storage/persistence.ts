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
import { readJson, writeJson } from "./backend";

const SETTINGS_KEY = "settings";
const DOCUMENTS_KEY = "documents";
const RECENT_KEY = "recent";
const DOCUMENTS_DEBOUNCE_MS = 400;

export async function loadSettings(): Promise<void> {
  applySettings(await readJson<Partial<Settings>>(SETTINGS_KEY, {}));
}

export function watchSettings(): () => void {
  return effect(() => {
    void writeJson(SETTINGS_KEY, snapshotSettings());
  });
}

export async function loadDocuments(): Promise<void> {
  const snapshot = await readJson<DocumentsSnapshot | null>(
    DOCUMENTS_KEY,
    null,
  );
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
      void writeJson(DOCUMENTS_KEY, snapshot);
    }, DOCUMENTS_DEBOUNCE_MS);
  });
}

export async function loadRecent(): Promise<void> {
  const files = await readJson<RecentFile[]>(RECENT_KEY, []);
  if (Array.isArray(files)) {
    restoreRecent(files);
  }
}

export function watchRecent(): () => void {
  return effect(() => {
    void writeJson(RECENT_KEY, recentFiles.get());
  });
}