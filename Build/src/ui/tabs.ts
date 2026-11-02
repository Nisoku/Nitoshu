import { effect } from "@nisoku/sairin";
import type { DocumentSummary } from "../state/documents";
import {
  activeDocumentId,
  closeDocument,
  documentSummaries,
  setActiveDocument,
} from "../state/documents";
import { createIcon, icons } from "./icons";

function renderTab(summary: DocumentSummary, activeId: string): HTMLElement {
  const tab = document.createElement("div");
  tab.className = "tab";
  tab.id = `tab-${summary.id}`;
  tab.role = "tab";
  tab.tabIndex = summary.id === activeId ? 0 : -1;
  tab.setAttribute("aria-selected", String(summary.id === activeId));
  tab.setAttribute("aria-label", summary.filename);
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
  tab.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveDocument(summary.id);
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }
    const siblings = Array.from(
      tab.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [],
    );
    const index = siblings.indexOf(tab);
    const nextIndex =
      (index + (event.key === "ArrowRight" ? 1 : -1) + siblings.length) %
      siblings.length;
    siblings[nextIndex]?.focus();
    const nextId = summariesForTabNavigation(siblings[nextIndex]);
    if (nextId !== undefined) {
      setActiveDocument(nextId);
    }
  });

  if (summary.kind !== "text") {
    const kindIcon = document.createElement("span");
    kindIcon.className = "tab-icon";
    kindIcon.append(
      createIcon(summary.kind === "image" ? icons.image : icons.file, 14),
    );
    tab.append(kindIcon);
  }

  function summariesForTabNavigation(
    tab: HTMLElement | undefined,
  ): string | undefined {
    return tab?.id.startsWith("tab-") ? tab.id.slice(4) : undefined;
  }

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
  close.title = "Close";
  close.append(createIcon(icons.close, 14));
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
