import { CodeMirrorEditor, getLanguageOptions } from "./codemirror-editor";
import type { EditorAdapter } from "./adapter";

export type { EditorAdapter, EditorTheme } from "./adapter";
export type { LanguageOption } from "./codemirror-editor";
export { getLanguageOptions };

export function createEditor(container: HTMLElement): EditorAdapter {
  return new CodeMirrorEditor(container);
}
