import { classifyFile } from "./file-kind";
import { readFileAsText } from "./reader";

export interface TextFolderFile {
  readonly kind: "text";
  readonly name: string;
  readonly relPath: string;
  readonly content: string;
  readonly handle: FileSystemFileHandle;
}

export interface PreviewFolderFile {
  readonly kind: "image" | "pdf";
  readonly name: string;
  readonly relPath: string;
  readonly file: File;
  readonly handle: FileSystemFileHandle;
}

export interface SkippedFolderFile {
  readonly kind: "binary" | "too-large";
  readonly name: string;
  readonly relPath: string;
}

export type FolderFile =
  | TextFolderFile
  | PreviewFolderFile
  | SkippedFolderFile;

const MAX_FOLDER_FILES = 200;

export function supportsFileSystemAccess(): boolean {
  return typeof window.showDirectoryPicker === "function";
}

export async function openFolderFromPicker(): Promise<FolderFile[]> {
  const root = await window.showDirectoryPicker();
  return readDirectory(root);
}

export async function readDirectory(
  root: FileSystemDirectoryHandle,
): Promise<FolderFile[]> {
  const handles = await collectFileHandles(root, "");
  const files = await Promise.all(
    handles.map(({ relPath, handle }) => toFolderFile(relPath, handle)),
  );
  return files.sort((a, b) => a.relPath.localeCompare(b.relPath));
}

async function toFolderFile(
  relPath: string,
  handle: FileSystemFileHandle,
): Promise<FolderFile> {
  const name = basename(relPath);
  const file = await handle.getFile();
  const { kind } = await classifyFile(file);
  if (kind === "text") {
    return { kind, name, relPath, content: await readFileAsText(file), handle };
  }
  if (kind === "image" || kind === "pdf") {
    return { kind, name, relPath, file, handle };
  }
  return { kind, name, relPath };
}

async function collectFileHandles(
  dir: FileSystemDirectoryHandle,
  prefix: string,
): Promise<Array<{ relPath: string; handle: FileSystemFileHandle }>> {
  const found: Array<{ relPath: string; handle: FileSystemFileHandle }> = [];
  for await (const [name, handle] of dir.entries()) {
    if (found.length >= MAX_FOLDER_FILES) {
      break;
    }
    const relPath = prefix === "" ? name : `${prefix}/${name}`;
    if (handle.kind === "file") {
      found.push({ relPath, handle: handle as FileSystemFileHandle });
      continue;
    }
    const nested = await collectFileHandles(
      handle as FileSystemDirectoryHandle,
      relPath,
    );
    for (const file of nested) {
      if (found.length >= MAX_FOLDER_FILES) {
        break;
      }
      found.push(file);
    }
  }
  return found;
}

export function basename(relPath: string): string {
  const index = relPath.lastIndexOf("/");
  return index === -1 ? relPath : relPath.slice(index + 1);
}

export function replaceBasename(relPath: string, name: string): string {
  const index = relPath.lastIndexOf("/");
  return index === -1 ? name : `${relPath.slice(0, index)}/${name}`;
}