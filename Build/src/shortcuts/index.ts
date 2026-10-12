export interface ShortcutSpec {
  key: string;
  mod?: boolean;
  shift?: boolean;
  alt?: boolean;
}

const IS_MAC =
  typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

export function shortcutLabel(spec: ShortcutSpec): string {
  const parts: string[] = [];
  if (spec.mod) {
    parts.push(IS_MAC ? "Cmd" : "Ctrl");
  }
  if (spec.alt) {
    parts.push("Alt");
  }
  if (spec.shift) {
    parts.push("Shift");
  }
  parts.push(spec.key.length === 1 ? spec.key.toUpperCase() : spec.key);
  return parts.join("+");
}

function matchesShortcut(event: KeyboardEvent, spec: ShortcutSpec): boolean {
  const modPressed = event.ctrlKey || event.metaKey;
  return (
    modPressed === (spec.mod === true) &&
    event.shiftKey === (spec.shift === true) &&
    event.altKey === (spec.alt === true) &&
    event.key.toLowerCase() === spec.key.toLowerCase()
  );
}

export interface CommandBinding {
  readonly id: string;
  readonly shortcut?: ShortcutSpec;
}

export function registerCommandShortcuts(
  commands: readonly CommandBinding[],
  actions: Readonly<Record<string, () => void>>,
): void {
  document.addEventListener(
    "keydown",
    (event) => {
      for (const command of commands) {
        const spec = command.shortcut;
        const action = actions[command.id];
        if (spec === undefined || action === undefined) {
          continue;
        }
        if (!matchesShortcut(event, spec)) {
          continue;
        }
        event.preventDefault();
        event.stopPropagation();
        action();
        return;
      }
    },
    true,
  );
}