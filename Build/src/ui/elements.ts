import type { EditorElements } from "../types";
import { getElement } from "../utils/dom";

function htmlElement(id: string): HTMLElement {
  return getElement(
    id,
    (element): element is HTMLElement => element instanceof HTMLElement,
  );
}

function button(id: string): HTMLButtonElement {
  return getElement(
    id,
    (element): element is HTMLButtonElement =>
      element instanceof HTMLButtonElement,
  );
}

function select(id: string): HTMLSelectElement {
  return getElement(
    id,
    (element): element is HTMLSelectElement =>
      element instanceof HTMLSelectElement,
  );
}

export function getEditorElements(): EditorElements {
  return {
    editor: htmlElement("editor"),
    editorContainer: htmlElement("editor-container"),
    openButton: button("open-button"),
    saveButton: button("save-button"),
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
    charCount: htmlElement("char-count"),
    saveStatus: htmlElement("save-status"),
    tabsContainer: htmlElement("tabs"),
    newTabButton: button("new-tab-button"),
    languageSelect: select("language-select"),
    searchButton: button("search-button"),
    settingsButton: button("settings-button"),
    settingsPanel: htmlElement("settings-panel"),
    closeSettingsButton: button("settings-close"),
    themeSelect: select("theme-select"),
    indentSelect: select("indent-select"),
    wordWrapToggle: getElement(
      "word-wrap-toggle",
      (element): element is HTMLInputElement =>
        element instanceof HTMLInputElement,
    ),
    recentList: htmlElement("recent-list"),
    zenButton: button("zen-button"),
    zenExitButton: button("zen-exit-button"),
  };
}
