import type { EditorAdapter } from "./adapter";

export class TextareaEditor implements EditorAdapter {
  constructor(private readonly textarea: HTMLTextAreaElement) {}

  getValue(): string {
    return this.textarea.value;
  }

  setValue(value: string): void {
    this.textarea.value = value;
  }

  focus(): void {
    this.textarea.focus();
  }

  onChange(listener: (value: string) => void): () => void {
    const handler = (): void => {
      listener(this.textarea.value);
    };
    this.textarea.addEventListener("input", handler);
    return () => {
      this.textarea.removeEventListener("input", handler);
    };
  }
}
