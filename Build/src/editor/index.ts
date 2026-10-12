import { CodeMirrorEditor } from "./codemirror-editor";
import type { EditorAdapter } from "./adapter";

export type { EditorAdapter } from "./adapter";

export function createEditor(container: HTMLElement): EditorAdapter {
  return new CodeMirrorEditor(container);
}
