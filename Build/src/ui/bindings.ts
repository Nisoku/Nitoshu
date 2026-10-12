import { bindEvent, bindProperty, bindText, type Signal } from "@nisoku/sairin";
import type { EditorElements } from "../types";
import { status } from "../state/status";
import {
  activeCharacterCountLabel,
  activeFilename,
  activeLanguage,
  setActiveFilename,
  setActiveLanguage,
} from "../state/documents";

export function bindSelectValue<T extends string>(
  select: HTMLSelectElement,
  signal: Signal<T>,
): () => void {
  const disposeProperty = bindProperty(select, "value", signal);
  const disposeChange = bindEvent(select, "change", () => {
    signal.set(select.value as T);
  });
  return () => {
    disposeProperty();
    disposeChange();
  };
}

export function bindCheckboxValue(
  input: HTMLInputElement,
  target: Signal<boolean>,
): () => void {
  const disposeProperty = bindProperty(input, "checked", target);
  const disposeChange = bindEvent(input, "change", () => {
    target.set(input.checked);
  });
  return () => {
    disposeProperty();
    disposeChange();
  };
}

export function bindStatusBar(elements: EditorElements): () => void {
  const disposeCharCount = bindText(
    elements.charCount,
    activeCharacterCountLabel,
  );
  const disposeStatus = bindText(elements.saveStatus, status);
  const disposeFilename = bindProperty(
    elements.filenameInput,
    "value",
    activeFilename,
  );
  const disposeLanguage = bindProperty(
    elements.languageSelect,
    "value",
    activeLanguage,
  );
  const onFilenameInput = bindEvent(elements.filenameInput, "input", (event) => {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      setActiveFilename(target.value);
    }
  });
  const onLanguageChange = bindEvent(
    elements.languageSelect,
    "change",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLSelectElement) {
        setActiveLanguage(target.value);
      }
    },
  );

  return () => {
    disposeCharCount();
    disposeStatus();
    disposeFilename();
    disposeLanguage();
    onFilenameInput();
    onLanguageChange();
  };
}
