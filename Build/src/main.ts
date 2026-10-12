import { bindEvent, effect } from "@nisoku/sairin";
import { createEditor } from "./editor";
import type { EditorAdapter } from "./editor";
import {
  DEFAULT_FILENAME,
  content,
  filename,
  flashStatus,
  loadDocument,
  markSaved,
  setContent,
  setStatus,
} from "./state/app-state";
import { registerFileHandlers } from "./files/file-handlers";
import { readFileAsText } from "./files/reader";
import { saveTextToFile } from "./files/saver";
import { registerShortcuts } from "./shortcuts";
import { getEditorElements } from "./ui/elements";
import { bindStatusBar } from "./ui/bindings";
import { registerDragAndDrop } from "./ui/drag-drop";
import type { EditorElements } from "./types";

const elements: EditorElements = getEditorElements();
const editor: EditorAdapter = createEditor(elements.editor);

bindStatusBar(elements);

effect(() => {
  const value = content.get();
  if (editor.getValue() !== value) {
    editor.setValue(value);
  }
});

effect(() => {
  editor.setLanguageFromFilename(filename.get());
});

function triggerLoad(): void {
  elements.fileInput.click();
}

async function openFile(file: File): Promise<void> {
  try {
    const value = await readFileAsText(file);
    loadDocument(value, file.name);
    setStatus(`Loaded: ${file.name}`);
  } catch (error) {
    setStatus("Failed to open file");
    console.error(error);
  }
}

function loadFile(input: HTMLInputElement): void {
  const file = input.files?.[0];
  input.value = "";
  if (file === undefined) {
    return;
  }
  void openFile(file);
}

function saveFile(): void {
  const name = elements.filenameInput.value.trim() || DEFAULT_FILENAME;
  saveTextToFile(editor.getValue(), name);
  markSaved(name);
  flashStatus("Saved to Downloads");
}

bindEvent(elements.openButton, "click", () => {
  triggerLoad();
});

bindEvent(elements.saveButton, "click", () => {
  saveFile();
});

bindEvent(elements.fileInput, "change", () => {
  loadFile(elements.fileInput);
});

editor.onChange((value) => {
  setContent(value);
  setStatus("Unsaved changes");
});

registerDragAndDrop({
  dropZone: document.body,
  highlight: elements.editor,
  onFile: (file) => {
    void openFile(file);
  },
});

registerFileHandlers((file) => {
  void openFile(file);
});

registerShortcuts({
  onSave: saveFile,
  onOpen: triggerLoad,
});

window.triggerLoad = triggerLoad;
window.saveFile = saveFile;
window.loadFile = loadFile;
window.readFile = (file: File): void => {
  void openFile(file);
};
