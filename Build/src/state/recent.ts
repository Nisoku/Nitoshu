import { path, signal } from "@nisoku/sairin";

export interface RecentFile {
  readonly filename: string;
  readonly content: string;
  readonly updatedAt: number;
}

export const MAX_RECENT_FILES = 8;

export const recentFiles = signal<RecentFile[]>(path("recent", "list"), []);

export function recordRecent(filename: string, content: string): void {
  const existing = recentFiles.get().filter((file) => file.filename !== filename);
  const next: RecentFile[] = [
    { filename, content, updatedAt: Date.now() },
    ...existing,
  ];
  recentFiles.set(next.slice(0, MAX_RECENT_FILES));
}

export function removeRecent(filename: string): void {
  recentFiles.set(recentFiles.get().filter((file) => file.filename !== filename));
}

export function restoreRecent(files: readonly RecentFile[]): void {
  recentFiles.set(files.slice(0, MAX_RECENT_FILES));
}
