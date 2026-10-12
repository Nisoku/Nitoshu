import { bindEvent, bindVisibility, effect } from "@nisoku/sairin";
import type { EditorElements } from "../types";
import { bindSelectValue } from "./bindings";
import {
  closeSettings,
  indentSetting,
  settingsOpen,
  themeSetting,
} from "../state/settings";
import { openDocument } from "../state/documents";
import { recentFiles } from "../state/recent";
import { flashStatus } from "../state/status";

function mountRecentList(elements: EditorElements): void {
  effect(() => {
    const files = recentFiles.get();
    if (files.length === 0) {
      const empty = document.createElement("p");
      empty.className = "recent-empty";
      empty.textContent = "No recent files yet.";
      elements.recentList.replaceChildren(empty);
      return;
    }
    elements.recentList.replaceChildren(
      ...files.map((file) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "recent-item";
        button.textContent = file.filename;
        button.title = file.filename;
        button.addEventListener("click", () => {
          openDocument(file.filename, file.content);
          flashStatus(`Loaded: ${file.filename}`);
          closeSettings();
        });
        return button;
      }),
    );
  });
}

export function bindSettingsPanel(elements: EditorElements): void {
  bindSelectValue(elements.themeSelect, themeSetting);
  bindSelectValue(elements.indentSelect, indentSetting);
  bindVisibility(elements.settingsPanel, settingsOpen);
  mountRecentList(elements);

  bindEvent(elements.settingsButton, "click", (event) => {
    event.stopPropagation();
    settingsOpen.update((open) => !open);
  });

  bindEvent(elements.closeSettingsButton, "click", () => {
    closeSettings();
  });

  document.addEventListener("click", (event) => {
    if (!settingsOpen.get()) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    if (
      elements.settingsPanel.contains(target) ||
      elements.settingsButton.contains(target)
    ) {
      return;
    }
    closeSettings();
  });
}
