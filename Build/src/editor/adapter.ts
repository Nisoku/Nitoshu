import type { IndentSetting } from "../state/settings";

export type EditorTheme = "light" | "dark";

export interface EditorAdapter {
  getValue(): string;
  setValue(value: string): void;
  /** Restores the editor state associated with a document, creating it if needed. */
  setDocument(id: string, value: string): void;
  focus(): void;
  onChange(listener: (value: string) => void): () => void;
  /** Focuses the editor and opens the find/replace panel. */
  toggleSearch(): void;
  /** `languageId` of "" means auto-detect from `filename`. */
  setLanguage(filename: string, languageId: string): void;
  setTheme(theme: EditorTheme): void;
  setIndent(indent: IndentSetting): void;
  setWordWrap(enabled: boolean): void;
}
