import { createEditor } from "./editor";
import type { EditorAdapter } from "./editor";
import { appStore, DEFAULT_FILENAME } from "./state/app-state";
import { registerFileHandlers } from "./files/file-handlers";
import { readFileAsText } from "./files/reader";
import { saveTextToFile } from "./files/saver";
import { registerShortcuts } from "./shortcuts";
import { getEditorElements } from "./ui/elements";
import { StatusBar } from "./ui/status-bar";
import { registerDragAndDrop } from "./ui/drag-drop";
import type { EditorElements } from "./types";

const elements: EditorElements = getEditorElements();
const editor: EditorAdapter = createEditor(elements.editor);
const statusBar = new StatusBar(elements.charCount, elements.saveStatus);

function triggerLoad(): void {
  elements.fileInput.click();
}

async function openFile(file: File): Promise<void> {
  try {
    const content = await readFileAsText(file);
    editor.setValue(content);
    elements.filenameInput.value = file.name;
    appStore.set({ content, filename: file.name, dirty: false });
    statusBar.setStatus(`Loaded: ${file.name}`);
  } catch (error) {
    statusBar.setStatus("Failed to open file");
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
  const filename = elements.filenameInput.value.trim() || DEFAULT_FILENAME;
  saveTextToFile(editor.getValue(), filename);
  appStore.set({ filename, dirty: false });
  statusBar.flash("Saved to Downloads", "Ready");
}

appStore.subscribe((state) => {
  statusBar.setCharacterCount(state.content.length);
});

editor.onChange((value) => {
  appStore.set({ content: value, dirty: true });
  statusBar.setStatus("Unsaved changes");
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
