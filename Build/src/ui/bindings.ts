import { bindProperty, bindText } from "@nisoku/sairin";
import type { EditorElements } from "../types";
import { characterCountLabel, filename, status } from "../state/app-state";

export function bindStatusBar(elements: EditorElements): () => void {
  const disposeCharCount = bindText(elements.charCount, characterCountLabel);
  const disposeStatus = bindText(elements.saveStatus, status);
  const disposeFilename = bindProperty(elements.filenameInput, "value", filename);

  return () => {
    disposeCharCount();
    disposeStatus();
    disposeFilename();
  };
}
