export interface ShortcutHandlers {
  onSave: () => void;
  onOpen: () => void;
  onFind: () => void;
}

export function registerShortcuts(handlers: ShortcutHandlers): void {
  document.addEventListener(
    "keydown",
    (event) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      if (event.altKey) {
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
        case "f":
          event.preventDefault();
          event.stopPropagation();
          handlers.onFind();
          break;
        default:
          break;
      }
    },
    true,
  );
}
