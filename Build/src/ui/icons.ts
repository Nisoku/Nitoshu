import {
  Download,
  FileText,
  FolderOpen,
  FolderTree,
  Maximize2,
  Minimize2,
  Plus,
  Search,
  Settings,
  X,
  createElement,
  type IconNode,
} from "lucide";
import type { EditorElements } from "../types";

export const icons = {
  open: FolderOpen,
  folder: FolderTree,
  save: Download,
  search: Search,
  settings: Settings,
  close: X,
  newTab: Plus,
  zen: Maximize2,
  zenExit: Minimize2,
  file: FileText,
} as const satisfies Record<string, IconNode>;

export function createIcon(node: IconNode, size = 16): SVGSVGElement {
  return createElement(node, {
    width: size,
    height: size,
    class: "icon",
    "aria-hidden": "true",
    focusable: "false",
  }) as SVGSVGElement;
}

export function setIcon(target: Element, node: IconNode, size = 16): void {
  target.replaceChildren(createIcon(node, size));
}

export function mountToolbarIcons(elements: EditorElements): void {
  elements.openButton.prepend(createIcon(icons.open));
  elements.saveButton.prepend(createIcon(icons.save));
  elements.folderButton.prepend(createIcon(icons.folder));
  elements.zenButton.prepend(createIcon(icons.zen));
  elements.settingsButton.prepend(createIcon(icons.settings));
  setIcon(elements.searchButton, icons.search);
  setIcon(elements.closeSettingsButton, icons.close);
  setIcon(elements.zenExitButton, icons.zenExit);
  setIcon(elements.newTabButton, icons.newTab);
}
