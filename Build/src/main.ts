import { bindEvent, effect } from "@nisoku/sairin";
import { createEditor, getLanguageOptions } from "./editor";
import type { EditorAdapter } from "./editor";
import {
  DEFAULT_FILENAME,
  activeContent,
  activeDocumentId,
  activeFilename,
  activeLanguage,
  createDocument,
  documentSummaries,
  markActiveSaved,
  openDocument,
  setActiveContent,
} from "./state/documents";
import { flashStatus } from "./state/status";
import {
  indentSetting,
  setZenMode,
  toggleZenMode,
  wordWrapSetting,
  zenMode,
} from "./state/settings";
import { applyTheme, resolvedTheme } from "./features/theme";
import { registerFileHandlers } from "./files/file-handlers";
import { readFileAsText } from "./files/reader";
import { saveTextToFile } from "./files/saver";
import { registerShortcuts } from "./shortcuts";
import {
  loadDocuments,
  loadRecent,
  loadSettings,
  watchDocuments,
  watchRecent,
  watchSettings,
} from "./storage/persistence";
import { recordRecent } from "./state/recent";
import { getEditorElements } from "./ui/elements";
import { bindStatusBar } from "./ui/bindings";
import { bindSettingsPanel } from "./ui/settings-panel";
import { mountTabBar } from "./ui/tabs";
import { mountToolbarIcons } from "./ui/icons";
import { registerDragAndDrop } from "./ui/drag-drop";
import type { EditorElements } from "./types";

loadSettings();
loadDocuments();
loadRecent();

const elements: EditorElements = getEditorElements();
const editor: EditorAdapter = createEditor(elements.editor);

for (const option of getLanguageOptions()) {
  const element = document.createElement("option");
  element.value = option.id;
  element.textContent = option.label;
  elements.languageSelect.append(element);
}

if (documentSummaries.peek().length === 0) {
  createDocument();
}

mountToolbarIcons(elements);
bindStatusBar(elements);
bindSettingsPanel(elements);
mountTabBar(elements.tabsContainer);

let lastDocumentId: string | null = null;

effect(() => {
  const id = activeDocumentId.get();
  const value = activeContent.get();
  if (id !== lastDocumentId) {
    lastDocumentId = id;
    editor.setDocument(value);
  } else if (editor.getValue() !== value) {
    editor.setValue(value);
  }
});

effect(() => {
  editor.setLanguage(activeFilename.get(), activeLanguage.get());
});

effect(() => {
  editor.setIndent(indentSetting.get());
});

effect(() => {
  editor.setWordWrap(wordWrapSetting.get());
});

effect(() => {
  document.body.classList.toggle("zen", zenMode.get());
});

effect(() => {
  const theme = resolvedTheme.get();
  applyTheme(theme);
  editor.setTheme(theme);
});

watchSettings();
watchDocuments();
watchRecent();

editor.onChange((value) => {
  setActiveContent(value);
});

function triggerLoad(): void {
  elements.fileInput.click();
}

async function openFile(file: File): Promise<void> {
  try {
    const value = await readFileAsText(file);
    openDocument(file.name, value);
    recordRecent(file.name, value);
    flashStatus(`Loaded: ${file.name}`);
  } catch (error) {
    flashStatus("Failed to open file", 4000);
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
  const content = editor.getValue();
  saveTextToFile(content, name);
  markActiveSaved(name);
  recordRecent(name, content);
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

bindEvent(elements.newTabButton, "click", () => {
  createDocument();
  editor.focus();
});

bindEvent(elements.searchButton, "click", () => {
  editor.toggleSearch();
});

bindEvent(elements.zenButton, "click", () => {
  toggleZenMode();
  editor.focus();
});

bindEvent(elements.zenExitButton, "click", () => {
  setZenMode(false);
  editor.focus();
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !zenMode.peek()) {
    return;
  }
  if (document.querySelector(".cm-search") !== null) {
    return;
  }
  setZenMode(false);
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
  onFind: () => {
    editor.toggleSearch();
  },
});

window.triggerLoad = triggerLoad;
window.saveFile = saveFile;
window.loadFile = loadFile;
window.readFile = (file: File): void => {
  void openFile(file);
};
