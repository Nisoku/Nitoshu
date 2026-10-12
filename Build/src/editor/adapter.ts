export interface EditorAdapter {
  getValue(): string;
  setValue(value: string): void;
  focus(): void;
  onChange(listener: (value: string) => void): () => void;
}
