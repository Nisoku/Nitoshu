export interface EditorElements {
  readonly editor: HTMLElement;
  readonly editorContainer: HTMLElement;
  readonly openButton: HTMLButtonElement;
  readonly saveButton: HTMLButtonElement;
  readonly fileInput: HTMLInputElement;
  readonly filenameInput: HTMLInputElement;
  readonly charCount: HTMLElement;
  readonly saveStatus: HTMLElement;
  readonly tabsContainer: HTMLElement;
  readonly newTabButton: HTMLButtonElement;
  readonly languageSelect: HTMLSelectElement;
  readonly searchButton: HTMLButtonElement;
  readonly settingsButton: HTMLButtonElement;
  readonly settingsPanel: HTMLElement;
  readonly closeSettingsButton: HTMLButtonElement;
  readonly themeSelect: HTMLSelectElement;
  readonly indentSelect: HTMLSelectElement;
  readonly wordWrapToggle: HTMLInputElement;
  readonly recentList: HTMLElement;
  readonly zenButton: HTMLButtonElement;
  readonly zenExitButton: HTMLButtonElement;
  readonly commandPalette: HTMLElement;
  readonly commandInput: HTMLInputElement;
  readonly commandList: HTMLElement;
}
