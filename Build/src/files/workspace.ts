import { readFileAsText } from "./reader";

export interface FolderFile {
  readonly name: string;
  readonly relPath: string;
  readonly content: string;
  readonly handle: FileSystemFileHandle;
}

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
  const files = await collectFileHandles(root, "");
  const read = await Promise.all(
    files.map(async ({ relPath, handle }) => {
      const file = await handle.getFile();
      return {
        name: basename(relPath),
        relPath,
        content: await readFileAsText(file),
        handle,
      };
    }),
  );
  return read.sort((a, b) => a.relPath.localeCompare(b.relPath));
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

function basename(relPath: string): string {
  const index = relPath.lastIndexOf("/");
  return index === -1 ? relPath : relPath.slice(index + 1);
}