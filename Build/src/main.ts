import { bindEvent, effect } from "@nisoku/sairin";
import { createEditor, getLanguageOptions } from "./editor";
import type { EditorAdapter } from "./editor";
import commandDefinitions from "./commands.json";
import {
  DEFAULT_FILENAME,
  activeContent,
  activeDocumentId,
  activeFilename,
  activeKind,
  activeLanguage,
  createPreviewUrl,
  closeDocument,
  createDocument,
  documentSummaries,
  getActiveSource,
  markActiveSaved,
  openDocument,
  setActiveContent,
  setActiveFilename,
  setActiveSource,
} from "./state/documents";
import { flashStatus } from "./state/status";
import {
  commandPaletteOpen,
  indentSetting,
  setZenMode,
  themeSetting,
  toggleCommandPalette,
  toggleSettings,
  toggleZenMode,
  wordWrapSetting,
  zenMode,
} from "./state/settings";
import { applyTheme, resolvedTheme } from "./features/theme";
import { registerFileHandlers } from "./files/file-handlers";
import { readFileAsText } from "./files/reader";
import { saveTextToFile, writeToFileHandle } from "./files/saver";
import { classifyFile } from "./files/file-kind";
import { renameFileHandle } from "./files/rename";
import type { RenameResult } from "./files/rename";
import { createHandleId, saveHandle } from "./storage/handles";
import {
  basename,
  MAX_FOLDER_FILES,
  openFolderFromPicker,
  replaceBasename,
  supportsFileSystemAccess,
} from "./files/workspace";
import { registerCommandShortcuts } from "./shortcuts";
import {
  loadDocuments,
  loadRecent,
  loadSettings,
  watchDocuments,
  watchRecent,
  watchSettings,
} from "./storage/persistence";
import { initStorage } from "./storage/backend";
import { recordRecent } from "./state/recent";
import { getEditorElements } from "./ui/elements";
import { bindStatusBar } from "./ui/bindings";
import { bindSettingsPanel } from "./ui/settings-panel";
import { mountTabBar } from "./ui/tabs";
import { mountToolbarIcons } from "./ui/icons";
import { mountCommandPalette, buildCommands } from "./ui/command-palette";
import { mountInlinePreview } from "./ui/preview";
import { registerDragAndDrop } from "./ui/drag-drop";
import type { EditorElements } from "./types";

async function bootstrap(): Promise<void> {
  await initStorage();
  await loadSettings();
  await loadDocuments();
  await loadRecent();

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
  mountInlinePreview(elements);

  const commandActions: Record<string, () => void> = {
    "new-file": () => {
      createDocument();
      editor.focus();
    },
    "open-file": () => {
      triggerLoad();
    },
    "open-folder": () => {
      void openFolder();
    },
    "save-file": () => {
      void saveFile();
    },
    find: () => {
      editor.toggleSearch();
    },
    "close-tab": () => {
      const id = activeDocumentId.peek();
      if (id !== null) {
        closeDocument(id);
      }
      editor.focus();
    },
    "close-all-tabs": () => {
      const summaries = documentSummaries.peek();
      if (
        summaries.some(doc => doc.dirty) &&
        !window.confirm("Close all tabs with unsaved changes?")
      ) {
        return;
      }
      for (const doc of [...summaries].reverse()) {
        closeDocument(doc.id);
      }
      editor.focus();
    },
    "word-wrap": () => {
      wordWrapSetting.update(enabled => !enabled);
    },
    zen: () => {
      toggleZenMode();
      editor.focus();
    },
    "theme-system": () => {
      themeSetting.set("system");
    },
    "theme-light": () => {
      themeSetting.set("light");
    },
    "theme-dark": () => {
      themeSetting.set("dark");
    },
    "indent-2": () => {
      indentSetting.set("2");
    },
    "indent-4": () => {
      indentSetting.set("4");
    },
    "indent-tab": () => {
      indentSetting.set("tab");
    },
    settings: () => {
      toggleSettings();
    },
    palette: toggleCommandPalette,
  };

  const commands = buildCommands(commandDefinitions, commandActions);

  mountCommandPalette(elements, commands);
  registerCommandShortcuts(commandDefinitions, commandActions);

  let lastDocumentId: string | null = null;

  effect(() => {
    const id = activeDocumentId.get();
    const value = activeContent.get();
    const kind = activeKind.get();
    if (id !== lastDocumentId) {
      lastDocumentId = id;
      if (kind === "text") {
        editor.setDocument(id, value);
      }
    } else if (kind === "text" && editor.getValue() !== value) {
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

  editor.onChange(value => {
    setActiveContent(value);
  });

  function triggerLoad(): void {
    elements.fileInput.click();
  }

  async function openFile(file: File): Promise<void> {
    try {
      const { kind } = await classifyFile(file);
      if (kind === "image" || kind === "pdf") {
        const url = createPreviewUrl(file, kind);
        openDocument(file.name, "", null, kind, { kind, url });
        flashStatus(`Previewing: ${file.name}`);
        return;
      }
      if (kind !== "text") {
        flashStatus(
          kind === "too-large"
            ? `Too large to open: ${file.name}`
            : `Unsupported binary file: ${file.name}`,
          4000
        );
        return;
      }
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

  async function openFolder(): Promise<void> {
    if (!supportsFileSystemAccess()) {
      elements.folderInput.click();
      return;
    }
    let files;
    try {
      files = await openFolderFromPicker();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      flashStatus("Failed to open folder", 4000);
      console.error(error);
      return;
    }
    let text = 0;
    let preview = 0;
    let skipped = 0;
    for (const file of files) {
      if (file.kind === "text") {
        const handleId = createHandleId();
        void saveHandle(handleId, file.handle);
        openDocument(file.name, file.content, {
          kind: "fs-access",
          handle: file.handle,
          relPath: file.relPath,
          handleId,
        });
        text += 1;
      } else if (file.kind === "image" || file.kind === "pdf") {
        const handleId = createHandleId();
        void saveHandle(handleId, file.handle);
        const url = createPreviewUrl(file.file, file.kind);
        openDocument(
          file.name,
          "",
          {
            kind: "fs-access",
            handle: file.handle,
            relPath: file.relPath,
            handleId,
          },
          file.kind,
          { kind: file.kind, url }
        );
        preview += 1;
      } else {
        skipped += 1;
      }
    }
    flashStatus(
      `Opened folder: ${text} text, ${preview} preview, ${skipped} skipped`
    );
  }

  async function openWebkitFolder(files: readonly File[]): Promise<void> {
    try {
      let text = 0;
      let preview = 0;
      let skipped = 0;
      const limitedFiles = files.slice(0, MAX_FOLDER_FILES);
      for (const file of limitedFiles) {
        const { kind } = await classifyFile(file);
        const relPath = file.webkitRelativePath || file.name;
        if (kind === "text") {
          const content = await readFileAsText(file);
          openDocument(file.name, content, { kind: "webkit", relPath });
          text += 1;
        } else if (kind === "image" || kind === "pdf") {
          const url = createPreviewUrl(file, kind);
          openDocument(file.name, "", { kind: "webkit", relPath }, kind, {
            kind,
            url,
          });
          preview += 1;
        } else {
          skipped += 1;
        }
      }
      flashStatus(
        `Opened folder: ${text} text, ${preview} preview, ${skipped} skipped` +
          (files.length > limitedFiles.length
            ? ` (${files.length - limitedFiles.length} not opened)`
            : "")
      );
    } catch (error) {
      flashStatus("Failed to open folder", 4000);
      console.error(error);
    }
  }

  function loadFolderInput(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = "";
    if (files.length === 0) {
      return;
    }
    void openWebkitFolder(files);
  }

  async function saveFile(): Promise<void> {
    if (activeKind.get() !== "text") {
      flashStatus("Preview tabs can't be saved", 3000);
      return;
    }
    const name = elements.filenameInput.value.trim() || DEFAULT_FILENAME;
    const content = editor.getValue();
    const source = getActiveSource();

    if (source?.kind === "fs-access") {
      try {
        await writeToFileHandle(source.handle, content);
        markActiveSaved(name);
        flashStatus(`Saved to ${source.relPath}`);
      } catch (error) {
        flashStatus("Failed to save file", 4000);
        console.error(error);
      }
      return;
    }

    saveTextToFile(content, name);
    markActiveSaved(name);
    recordRecent(name, content);
    flashStatus(
      source?.kind === "webkit"
        ? "Saved to Downloads (folder is read-only)"
        : "Saved to Downloads"
    );
  }

  async function commitRename(): Promise<void> {
    const source = getActiveSource();
    if (source?.kind !== "fs-access") {
      return;
    }
    const oldName = basename(source.relPath);
    const desired = elements.filenameInput.value.trim();
    if (desired === "") {
      setActiveFilename(oldName);
      return;
    }
    if (desired === oldName) {
      return;
    }
    if (desired.includes("/") || desired.includes("\\")) {
      flashStatus("File names can't contain slashes", 3000);
      setActiveFilename(oldName);
      return;
    }
    let result: RenameResult;
    try {
      result = await renameFileHandle(source.handle, desired);
    } catch (error) {
      flashStatus(`Failed to rename: ${desired}`, 4000);
      setActiveFilename(oldName);
      console.error(error);
      return;
    }
    if (result === "unsupported") {
      flashStatus("Renaming on disk isn't supported here", 3500);
      return;
    }
    if (result === "denied") {
      flashStatus("Rename permission denied", 3000);
      setActiveFilename(oldName);
      return;
    }
    setActiveSource({
      kind: "fs-access",
      handle: source.handle,
      relPath: replaceBasename(source.relPath, desired),
      handleId: source.handleId,
    });
    flashStatus(`Renamed to ${desired}`);
  }

  bindEvent(elements.openButton, "click", () => {
    triggerLoad();
  });

  bindEvent(elements.folderButton, "click", () => {
    void openFolder();
  });

  bindEvent(elements.saveButton, "click", () => {
    void saveFile();
  });

  bindEvent(elements.fileInput, "change", () => {
    loadFile(elements.fileInput);
  });

  bindEvent(elements.filenameInput, "change", () => {
    void commitRename();
  });

  bindEvent(elements.folderInput, "change", () => {
    loadFolderInput(elements.folderInput);
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

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") {
      return;
    }
    if (!zenMode.peek()) {
      return;
    }
    if (
      document.querySelector(".cm-search") !== null ||
      commandPaletteOpen.peek()
    ) {
      return;
    }
    setZenMode(false);
  });

  registerDragAndDrop({
    dropZone: document.body,
    highlight: elements.editor,
    onFile: file => {
      void openFile(file);
    },
  });

  registerFileHandlers(file => {
    void openFile(file);
  });

  window.triggerLoad = triggerLoad;
  window.openFolder = openFolder;
  window.saveFile = saveFile;
  window.loadFile = loadFile;
  window.readFile = (file: File): void => {
    void openFile(file);
  };
}

void bootstrap();
