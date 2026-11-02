export interface DragAndDropOptions {
  dropZone: HTMLElement;
  highlight: HTMLElement;
  onFile: (file: File) => void;
}

export function registerDragAndDrop(options: DragAndDropOptions): void {
  const { dropZone, highlight, onFile } = options;
  const setActive = (active: boolean): void => {
    highlight.classList.toggle("drag-over", active);
  };

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    setActive(true);
  });

  dropZone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    setActive(false);
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    setActive(false);
    const file = event.dataTransfer?.files[0];
    if (file !== undefined) {
      onFile(file);
    }
  });
}
