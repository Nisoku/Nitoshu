import type { EditorElements } from "../types";
import { getElement } from "../utils/dom";

export function getEditorElements(): EditorElements {
  return {
    editor: getElement(
      "editor",
      (element): element is HTMLTextAreaElement =>
        element instanceof HTMLTextAreaElement,
    ),
    editorContainer: getElement(
      "editor-container",
      (element): element is HTMLElement => element instanceof HTMLElement,
    ),
    fileInput: getElement(
      "file-input",
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement,
    ),
    filenameInput: getElement(
      "filename-input",
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement,
    ),
    charCount: getElement(
      "char-count",
      (element): element is HTMLElement => element instanceof HTMLElement,
    ),
    saveStatus: getElement(
      "save-status",
      (element): element is HTMLElement => element instanceof HTMLElement,
    ),
  };
}
