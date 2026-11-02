import { batch, derived, path, signal } from "@nisoku/sairin";
import type { Signal } from "@nisoku/sairin";
import { formatCharacterCount } from "../utils/format";
import { loadHandle, removeHandle } from "../storage/handles";

export const DEFAULT_FILENAME = "Untitled.txt";

export interface DocumentSummary {
  readonly id: string;
  readonly filename: string;
  readonly dirty: boolean;
  readonly kind: DocumentKind;
}

/** Serializable form of {@link DocumentSource}; handles live in IndexedDB. */
export type StoredSource =
  | { readonly kind: "fs-access"; readonly handleId: string; readonly relPath: string }
  | { readonly kind: "webkit"; readonly relPath: string };

export interface StoredDocument {
  readonly filename: string;
  readonly content: string;
  readonly dirty: boolean;
  readonly language: string;
  readonly kind: DocumentKind;
  readonly source: StoredSource | null;
}

export interface DocumentsSnapshot {
  readonly documents: readonly StoredDocument[];
  readonly activeIndex: number;
}

export type DocumentSource =
  | {
      readonly kind: "fs-access";
      readonly handle: FileSystemFileHandle;
      readonly relPath: string;
      readonly handleId: string;
    }
  | { readonly kind: "webkit"; readonly relPath: string };

export type DocumentKind = "text" | "image" | "pdf";

export interface PreviewInfo {
  readonly kind: "image" | "pdf";
  /** Null means the object URL still needs to be created (permission gate). */
  readonly url: string | null;
}

export function createPreviewUrl(
  file: Blob,
  kind: "image" | "pdf",
): string {
  if (kind === "pdf" && file.type !== "application/pdf") {
    return URL.createObjectURL(new Blob([file], { type: "application/pdf" }));
  }
  return URL.createObjectURL(file);
}

interface DocumentRecord {
  readonly content: Signal<string>;
  readonly filename: Signal<string>;
  readonly dirty: Signal<boolean>;
  /** Empty string means "auto-detect from the filename". */
  readonly language: Signal<string>;
  /** In-memory edit-in-place source; persists as a handle id across sessions. */
  readonly source: Signal<DocumentSource | null>;
  readonly docKind: Signal<DocumentKind>;
  readonly preview: Signal<PreviewInfo | null>;
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
      source: signal<DocumentSource | null>(
        path("documents", id, "source"),
        null,
      ),
      docKind: signal<DocumentKind>(path("documents", id, "kind"), "text"),
      preview: signal<PreviewInfo | null>(path("documents", id, "preview"), null),
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

export const activeKind = derived(
  path("documents", "activeKind"),
  () => {
    const id = activeId.get();
    return id === "" ? "text" : getRecord(id).docKind.get();
  },
);

export const activePreview = derived(
  path("documents", "activePreview"),
  () => {
    const id = activeId.get();
    return id === "" ? null : getRecord(id).preview.get();
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
        kind: record.docKind.get(),
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
  source: DocumentSource | null = null,
  docKind: DocumentKind = "text",
  preview: PreviewInfo | null = null,
): string {
  const id = `doc-${++idCounter}`;
  const record = getRecord(id);
  batch(() => {
    record.filename.set(filename);
    record.content.set(content);
    record.dirty.set(false);
    record.language.set("");
    record.source.set(source);
    record.docKind.set(docKind);
    record.preview.set(preview);
    order.set([...order.get(), id]);
    activeId.set(id);
  });
  return id;
}

function loadInto(
  id: string,
  filename: string,
  content: string,
  source: DocumentSource | null = null,
  docKind: DocumentKind = "text",
  preview: PreviewInfo | null = null,
): void {
  const record = getRecord(id);
  const previous = record.preview.peek();
  if (previous?.url != null && previous.url !== preview?.url) {
    URL.revokeObjectURL(previous.url);
  }
  batch(() => {
    record.content.set(content);
    record.filename.set(filename);
    record.dirty.set(false);
    record.language.set("");
    record.source.set(source);
    record.docKind.set(docKind);
    record.preview.set(preview);
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

export function openDocument(
  filename: string,
  content: string,
  source: DocumentSource | null = null,
  docKind: DocumentKind = "text",
  preview: PreviewInfo | null = null,
): string {
  // Already open? Focus the existing tab instead of creating a duplicate.
  const existing = findDocumentIdByFilename(filename);
  if (existing !== null) {
    if (isReusable(existing)) {
      loadInto(existing, filename, content, source, docKind, preview);
    }
    activeId.set(existing);
    return existing;
  }

  const id = activeId.get();
  if (id !== "" && isReusable(id)) {
    loadInto(id, filename, content, source, docKind, preview);
    return id;
  }

  return createDocument(filename, content, source, docKind, preview);
}

export function closeDocument(id: string): void {
  const record = getRecord(id);
  const preview = record.preview.peek();
  if (preview?.url != null) {
    URL.revokeObjectURL(preview.url);
  }
  const source = record.source.peek();
  if (source?.kind === "fs-access") {
    void removeHandle(source.handleId);
  }
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

export function getActiveSource(): DocumentSource | null {
  const id = activeId.get();
  return id === "" ? null : getRecord(id).source.get();
}

export function setActiveSource(source: DocumentSource | null): void {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  getRecord(id).source.set(source);
}

export async function requestActivePreview(): Promise<void> {
  const id = activeId.get();
  if (id === "") {
    return;
  }
  const record = getRecord(id);
  const preview = record.preview.get();
  if (preview === null || preview.url !== null) {
    return;
  }
  const source = record.source.get();
  if (source?.kind !== "fs-access") {
    return;
  }
  const options: FileSystemHandlePermissionDescriptor = { mode: "read" };
  try {
    const granted =
      (await source.handle.queryPermission(options)) === "granted" ||
      (await source.handle.requestPermission(options)) === "granted";
    if (!granted) {
      return;
    }
    const file = await source.handle.getFile();
    record.preview.set({
      kind: preview.kind,
      url: createPreviewUrl(file, preview.kind),
    });
  } catch (error) {
    console.error(error);
  }
}

function toStoredSource(source: DocumentSource | null): StoredSource | null {
  if (source === null) {
    return null;
  }
  if (source.kind === "fs-access") {
    return {
      kind: "fs-access",
      handleId: source.handleId,
      relPath: source.relPath,
    };
  }
  return { kind: "webkit", relPath: source.relPath };
}

async function resolveStoredSource(
  source: StoredSource | null | undefined,
): Promise<DocumentSource | null> {
  if (source == null) {
    return null;
  }
  if (source.kind === "webkit") {
    return { kind: "webkit", relPath: source.relPath };
  }
  const handle = await loadHandle(source.handleId);
  if (handle === null || handle.kind !== "file") {
    return null;
  }
  return {
    kind: "fs-access",
    handle: handle as FileSystemFileHandle,
    relPath: source.relPath,
    handleId: source.handleId,
  };
}

async function hydratePreviewUrl(
  handle: FileSystemFileHandle,
  kind: "image" | "pdf",
): Promise<string | null> {
  try {
    const options: FileSystemHandlePermissionDescriptor = { mode: "read" };
    if ((await handle.queryPermission(options)) !== "granted") {
      return null;
    }
    const file = await handle.getFile();
    return createPreviewUrl(file, kind);
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function snapshotDocuments(): DocumentsSnapshot {
  const documents: StoredDocument[] = [];
  let activeIndex = 0;
  const active = activeId.get();

  for (const id of order.get()) {
    const record = getRecord(id);
    const kind = record.docKind.get();
    const source = toStoredSource(record.source.get());
    // Preview tabs only survive when backed by a restorable file handle.
    if (kind !== "text" && source?.kind !== "fs-access") {
      continue;
    }
    if (id === active) {
      activeIndex = documents.length;
    }
    documents.push({
      filename: record.filename.get(),
      content: record.content.get(),
      dirty: record.dirty.get(),
      language: record.language.get(),
      kind,
      source,
    });
  }

  return { documents, activeIndex };
}

export async function restoreDocuments(
  snapshot: DocumentsSnapshot,
): Promise<void> {
  const stored = snapshot.documents;
  if (stored.length === 0) {
    return;
  }

  interface PendingDocument {
    readonly id: string;
    readonly doc: StoredDocument;
    readonly source: DocumentSource | null;
  }

  const pending: PendingDocument[] = [];
  const mapped: (string | null)[] = [];

  for (const doc of stored) {
    const kind = doc.kind ?? "text";
    const source = await resolveStoredSource(doc.source);
    if (kind !== "text" && source?.kind !== "fs-access") {
      mapped.push(null);
      continue;
    }
    const id = `doc-${++idCounter}`;
    mapped.push(id);
    pending.push({ id, doc, source });
  }

  const first = pending[0]?.id ?? "";

  batch(() => {
    for (const { id, doc, source } of pending) {
      const record = getRecord(id);
      record.filename.set(doc.filename);
      record.content.set(doc.content);
      record.dirty.set(doc.dirty);
      record.language.set(doc.language);
      record.source.set(source);
      const kind = doc.kind ?? "text";
      record.docKind.set(kind);
      record.preview.set(kind === "text" ? null : { kind, url: null });
    }
    order.set(pending.map((entry) => entry.id));
    activeId.set(mapped[snapshot.activeIndex] ?? first);
  });

  for (const { id, doc, source } of pending) {
    if (doc.kind === "text" || source?.kind !== "fs-access") {
      continue;
    }
    const url = await hydratePreviewUrl(source.handle, doc.kind);
    if (url === null) {
      continue;
    }
    const record = getRecord(id);
    const current = record.preview.get();
    if (current !== null && current.url === null) {
      record.preview.set({ kind: current.kind, url });
    }
  }
}
