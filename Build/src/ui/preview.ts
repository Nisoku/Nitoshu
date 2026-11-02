import { bindEvent, effect } from "@nisoku/sairin";
import type { EditorElements } from "../types";
import { activeFilename, activePreview, requestActivePreview } from "../state/documents";

export function mountInlinePreview(elements: EditorElements): void {
  let renderedKey: string | null = null;

  effect(() => {
    const preview = activePreview.get();
    const filename = activeFilename.get();

    if (preview === null) {
      if (renderedKey !== null) {
        elements.previewInline.replaceChildren();
        renderedKey = null;
      }
      elements.previewInline.hidden = true;
      elements.editor.hidden = false;
      return;
    }

    const key = preview.url ?? "pending";
    if (key !== renderedKey) {
      elements.previewInline.replaceChildren();
      if (preview.url === null) {
        const pending = document.createElement("div");
        pending.className = "preview-pending";

        const message = document.createElement("p");
        message.textContent = `Grant access to view ${filename}.`;

        const load = document.createElement("button");
        load.type = "button";
        load.textContent = "Load preview";

        pending.append(message, load);
        elements.previewInline.append(pending);
      } else if (preview.kind === "image") {
        const image = document.createElement("img");
        image.src = preview.url;
        image.alt = filename;
        image.className = "preview-image";
        elements.previewInline.append(image);
      } else {
        const frame = document.createElement("iframe");
        frame.src = preview.url;
        frame.title = filename;
        frame.className = "preview-frame";
        elements.previewInline.append(frame);
      }
      renderedKey = key;
    } else {
      const holder = elements.previewInline.firstElementChild;
      if (holder instanceof HTMLImageElement) {
        holder.alt = filename;
      } else if (holder instanceof HTMLIFrameElement) {
        holder.title = filename;
      }
    }

    elements.previewInline.hidden = false;
    elements.editor.hidden = true;
  });

  bindEvent(elements.previewInline, "click", (event) => {
    if (event.target instanceof HTMLButtonElement) {
      void requestActivePreview();
    }
  });
}
