export interface ShortcutHandlers {
  onSave: () => void;
  onOpen: () => void;
}

export function registerShortcuts(handlers: ShortcutHandlers): void {
  document.addEventListener("keydown", (event) => {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case "s":
        event.preventDefault();
        handlers.onSave();
        break;
      case "o":
        event.preventDefault();
        handlers.onOpen();
        break;
      default:
        break;
    }
  });
}
