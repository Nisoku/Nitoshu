import { effect } from "@nisoku/sairin";
import { applySettings, snapshotSettings } from "../state/settings";
import {
  restoreDocuments,
  snapshotDocuments,
  type DocumentsSnapshot,
} from "../state/documents";
import { restoreRecent, recentFiles, type RecentFile } from "../state/recent";
import {
  clearPersistenceFailure,
  reportPersistenceFailure,
} from "../state/status";
import { readJson, writeJson } from "./backend";

const SETTINGS_KEY = "settings";
const DOCUMENTS_KEY = "documents";
const RECENT_KEY = "recent";
const DOCUMENTS_DEBOUNCE_MS = 400;

export async function loadSettings(): Promise<void> {
  const settings = await readJson<unknown>(SETTINGS_KEY, null);
  if (isRecord(settings)) {
    applySettings(settings);
  }
}

export function watchSettings(): () => void {
  return effect(() => {
    void writeJson(SETTINGS_KEY, snapshotSettings()).catch((error: unknown) => {
      reportPersistenceFailure();
      console.error("Failed to persist settings", error);
    });
  });
}

export async function loadDocuments(): Promise<void> {
  const snapshot = await readJson<unknown>(DOCUMENTS_KEY, null);
  if (isDocumentsSnapshot(snapshot)) {
    await restoreDocuments(snapshot);
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
      void writeJson(DOCUMENTS_KEY, snapshot).then(
        clearPersistenceFailure,
        (error: unknown) => {
          reportPersistenceFailure();
          console.error("Failed to persist documents", error);
        },
      );
    }, DOCUMENTS_DEBOUNCE_MS);
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStoredDocument(
  value: unknown,
): value is DocumentsSnapshot["documents"][number] {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.filename === "string" &&
    typeof value.content === "string" &&
    typeof value.dirty === "boolean" &&
    typeof value.language === "string" &&
    (value.kind === "text" || value.kind === "image" || value.kind === "pdf") &&
    isStoredSource(value.source)
  );
}

function isStoredSource(value: unknown): boolean {
  if (value === null) {
    return true;
  }
  if (!isRecord(value) || typeof value.relPath !== "string") {
    return false;
  }
  if (value.kind === "webkit") {
    return true;
  }
  return value.kind === "fs-access" && typeof value.handleId === "string";
}

function isDocumentsSnapshot(value: unknown): value is DocumentsSnapshot {
  const activeIndex = isRecord(value) ? value.activeIndex : undefined;
  const documents = isRecord(value) ? value.documents : undefined;
  return (
    isRecord(value) &&
    typeof activeIndex === "number" &&
    Number.isInteger(activeIndex) &&
    activeIndex >= 0 &&
    Array.isArray(documents) &&
    (documents.length === 0 || activeIndex < documents.length) &&
    documents.every(isStoredDocument)
  );
}

export async function loadRecent(): Promise<void> {
  const files = await readJson<RecentFile[]>(RECENT_KEY, []);
  if (Array.isArray(files)) {
    restoreRecent(files);
  }
}

export function watchRecent(): () => void {
  return effect(() => {
    void writeJson(RECENT_KEY, recentFiles.get()).catch((error: unknown) => {
      reportPersistenceFailure();
      console.error("Failed to persist recent files", error);
    });
  });
}
