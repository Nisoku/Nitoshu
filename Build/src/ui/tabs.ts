import { effect } from "@nisoku/sairin";
import type { DocumentSummary } from "../state/documents";
import {
  activeDocumentId,
  closeDocument,
  documentSummaries,
  setActiveDocument,
} from "../state/documents";

function renderTab(summary: DocumentSummary, activeId: string): HTMLElement {
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.classList.toggle("active", summary.id === activeId);
  tab.classList.toggle("dirty", summary.dirty);
  tab.title = summary.filename;

  tab.addEventListener("click", () => {
    setActiveDocument(summary.id);
  });
  tab.addEventListener("auxclick", (event) => {
    if (event.button === 1) {
      event.preventDefault();
      closeDocument(summary.id);
    }
  });

  const label = document.createElement("span");
  label.className = "tab-label";
  label.textContent = summary.filename;
  tab.append(label);

  const dirtyDot = document.createElement("span");
  dirtyDot.className = "tab-dirty";
  dirtyDot.textContent = "●";
  tab.append(dirtyDot);

  const close = document.createElement("button");
  close.type = "button";
  close.className = "tab-close";
  close.textContent = "×";
  close.title = "Close";
  close.addEventListener("click", (event) => {
    event.stopPropagation();
    closeDocument(summary.id);
  });
  tab.append(close);

  return tab;
}

export function mountTabBar(container: HTMLElement): () => void {
  return effect(() => {
    const summaries = documentSummaries.get();
    const activeId = activeDocumentId.get();
    container.replaceChildren(
      ...summaries.map((summary) => renderTab(summary, activeId)),
    );
  });
}
