import { formatCharacterCount } from "../utils/format";

export class StatusBar {
  private resetTimer: number | undefined;

  constructor(
    private readonly charCount: HTMLElement,
    private readonly saveStatus: HTMLElement,
  ) {}

  setCharacterCount(length: number): void {
    this.charCount.textContent = formatCharacterCount(length);
  }

  setStatus(message: string): void {
    this.saveStatus.textContent = message;
  }

  flash(message: string, resetTo: string, durationMs = 2000): void {
    this.setStatus(message);
    if (this.resetTimer !== undefined) {
      window.clearTimeout(this.resetTimer);
    }
    this.resetTimer = window.setTimeout(() => {
      this.resetTimer = undefined;
      this.setStatus(resetTo);
    }, durationMs);
  }
}
