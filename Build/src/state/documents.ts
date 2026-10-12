import { batch, derived, path, signal } from "@nisoku/sairin";
import type { Signal } from "@nisoku/sairin";
import { formatCharacterCount } from "../utils/format";

export const DEFAULT_FILENAME = "Untitled.txt";

export interface DocumentSummary {
  readonly id: string;
  readonly filename: string;
  readonly dirty: boolean;
}

export interface StoredDocument {
  readonly filename: string;
  readonly content: string;
  readonly dirty: boolean;
  readonly language: string;
}

export interface DocumentsSnapshot {
  readonly documents: readonly StoredDocument[];
  readonly activeIndex: number;
}

interface DocumentRecord {
  readonly content: Signal<string>;
  readonly filename: Signal<string>;
  readonly dirty: Signal<boolean>;
  /** Empty string means "auto-detect from the filename". */
  readonly language: Signal<string>;
}

const records = new Map<string, DocumentRecord>();
let idCounter = 0;

const order = signal<string[]>(path("documents", "order"), []);
const activeId = signal<string>(path("documents", "activeId"), "");

function getRecord(id: string): DocumentRecord {
  let record = records.get(id);
  if (record === undefined) {
    record = {
      content: signal<string>(path("documents", id, "content"), ""),
      filename: signal<string>(
        path("documents", id, "filename"),
        DEFAULT_FILENAME,
      ),
      dirty: signal<boolean>(path("documents", id, "dirty"), false),
      language: signal<string>(path("documents", id, "language"), ""),
    };
    records.set(id, record);
  }
  return record;
}

export const activeDocumentId = derived(
  path("documents", "activeIdView"),
  () => activeId.get(),
);

export const activeContent = derived(path("documents", "activeContent"), () => {
  const id = activeId.get();
  return id === "" ? "" : getRecord(id).content.get();
});

export const activeFilename = derived(
  path("documents", "activeFilename"),
  () => {
    const id = activeId.get();
    return id === "" ? DEFAULT_FILENAME : getRecord(id).filename.get();
  },
);

export const activeDirty = derived(path("documents", "activeDirty"), () => {
  const id = activeId.get();
  return id === "" ? false : getRecord(id).dirty.get();
});

export const activeLanguage = derived(
  path("documents", "activeLanguage"),
  () => {
    const id = activeId.get();
    return id === "" ? "" : getRecord(id).language.get();
  },
);

export const documentSummaries = derived(
  path("documents", "summaries"),
  (): DocumentSummary[] =>
    order.get().map((id) => {
      const record = getRecord(id);
      return {
        id,
        filename: record.filename.get(),
        dirty: record.dirty.get(),
      };
    }),
);

export const activeCharacterCount = derived(
  path("documents", "activeCharacterCount"),
  () => activeContent.get().length,
);

export const activeCharacterCountLabel = derived(
  path("documents", "activeCharacterCountLabel"),
  () => formatCharacterCount(activeCharacterCount.get()),
);

function isReusable(id: string): boolean {
  if (order.get().length !== 1) {
    return false;
  }
  const record = getRecord(id);
  return (
    record.content.get() === "" &&
    record.filename.get() === DEFAULT_FILENAME &&
    !record.dirty.get()
  );
}

export function createDocument(
  filename: string = DEFAULT_FILENAME,
  content = "",
): string {
  const id = `doc-${++idCounter}`;
  const record = getRecord(id);
  batch(() => {
    record.filename.set(filename);
    record.content.set(content);
    record.dirty.set(false);
    record.language.set("");
    order.set([...order.get(), id]);
    activeId.set(id);
  });
  return id;
}

function loadInto(id: string, filename: string, content: string): void {
  const record = getRecord(id);
  batch(() => {
    record.content.set(content);
    record.filename.set(filename);
    record.dirty.set(false);
    record.language.set("");
  });
}

function findDocumentIdByFilename(filename: string): string | null {
  const target = filename.trim();
  for (const id of order.get()) {
    if (getRecord(id).filename.get().trim() === target) {
      return id;
    }
  }
  return null;
}

export function openDocument(filename: string, content: string): string {
  // Already open? Focus the existing tab instead of creating a duplicate.
  const existing = findDocumentIdByFilename(filename);
  if (existing !== null) {
    if (isReusable(existing)) {
      loadInto(existing, filename, content);
    }
    activeId.set(existing);
    return existing;
  }

  const id = activeId.get();
  if (id !== "" && isReusable(id)) {
    loadInto(id, filename, content);
    return id;
  }

  return createDocument(filename, content);
}

export function closeDocument(id: string): void {
  const ids = order.get();
  const index = ids.indexOf(id);
  if (index === -1) {
    return;
  }
  const remaining = ids.filter((value) => value !== id);
  batch(() => {
    order.set(remaining);
    if (activeId.get() === id) {
      const fallback =
        remaining[Math.min(index, remaining.length - 1)] ?? "";
      activeId.set(fallback);
    }
  });
  records.delete(id);
}

export function setActiveDocument(id: string): void {
  if (order.get().includes(id)) {
    activeId.set(id);
  }
}

export function setActiveContent(value: string): void {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  const record = getRecord(id);
  batch(() => {
    record.content.set(value);
    record.dirty.set(true);
  });
}

export function setActiveFilename(filename: string): void {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  getRecord(id).filename.set(filename);
}

export function setActiveLanguage(language: string): void {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  getRecord(id).language.set(language);
}

export function markActiveSaved(filename: string): void {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  const record = getRecord(id);
  batch(() => {
    record.filename.set(filename);
    record.dirty.set(false);
  });
}

export function snapshotDocuments(): DocumentsSnapshot {
  const ids = order.get();
  const documents = ids.map((id): StoredDocument => {
    const record = getRecord(id);
    return {
      filename: record.filename.get(),
      content: record.content.get(),
      dirty: record.dirty.get(),
      language: record.language.get(),
    };
  });
  const activeIndex = Math.max(0, ids.indexOf(activeId.get()));
  return { documents, activeIndex };
}

export function restoreDocuments(snapshot: DocumentsSnapshot): void {
  const stored = snapshot.documents;
  if (stored.length === 0) {
    return;
  }
  const ids = stored.map(() => `doc-${++idCounter}`);
  batch(() => {
    stored.forEach((doc, index) => {
      const id = ids[index];
      if (id === undefined) {
        return;
      }
      const record = getRecord(id);
      record.filename.set(doc.filename);
      record.content.set(doc.content);
      record.dirty.set(doc.dirty);
      record.language.set(doc.language);
    });
    order.set(ids);
    activeId.set(ids[snapshot.activeIndex] ?? ids[0] ?? "");
  });
}
