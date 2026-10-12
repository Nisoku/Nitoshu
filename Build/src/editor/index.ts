import { TextareaEditor } from "./textarea-editor";
import type { EditorAdapter } from "./adapter";

export type { EditorAdapter } from "./adapter";

export function createEditor(textarea: HTMLTextAreaElement): EditorAdapter {
  return new TextareaEditor(textarea);
}
