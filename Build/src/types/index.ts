export interface EditorElements {
  readonly editor: HTMLTextAreaElement;
  readonly editorContainer: HTMLElement;
  readonly fileInput: HTMLInputElement;
  readonly filenameInput: HTMLInputElement;
  readonly charCount: HTMLElement;
  readonly saveStatus: HTMLElement;
}

export interface AppState {
  content: string;
  filename: string;
  dirty: boolean;
}
