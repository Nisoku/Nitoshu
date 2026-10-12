import { bindEvent, bindVisibility, effect } from "@nisoku/sairin";
import type { EditorElements } from "../types";
import { closeCommandPalette, commandPaletteOpen } from "../state/settings";
import { shortcutLabel, type ShortcutSpec } from "../shortcuts";

export interface Command {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly run: () => void;
}

export interface CommandDefinition {
  readonly id: string;
  readonly label: string;
  readonly shortcut?: ShortcutSpec;
}

export function buildCommands(
  definitions: readonly CommandDefinition[],
  actions: Readonly<Record<string, () => void>>,
): Command[] {
  return definitions.map((definition) => {
    const run = actions[definition.id];
    if (run === undefined) {
      throw new Error(`No runner registered for command "${definition.id}"`);
    }
    return {
      id: definition.id,
      label: definition.label,
      hint:
        definition.shortcut !== undefined
          ? shortcutLabel(definition.shortcut)
          : undefined,
      run,
    };
  });
}

export function mountCommandPalette(
  elements: EditorElements,
  commands: readonly Command[],
): void {
  let filtered: Command[] = [...commands];
  let selectedIndex = 0;

  const render = (): void => {
    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "command-empty";
      empty.textContent = "No matching commands";
      elements.commandList.replaceChildren(empty);
      return;
    }

    elements.commandList.replaceChildren(
      ...filtered.map((command, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "command-item";
        item.classList.toggle("selected", index === selectedIndex);

        const label = document.createElement("span");
        label.className = "command-label";
        label.textContent = command.label;
        item.append(label);

        if (command.hint !== undefined) {
          const hint = document.createElement("span");
          hint.className = "command-hint";
          hint.textContent = command.hint;
          item.append(hint);
        }

        item.addEventListener("click", () => {
          run(command);
        });
        item.addEventListener("mousemove", () => {
          if (selectedIndex !== index) {
            selectedIndex = index;
            render();
          }
        });
        return item;
      }),
    );

    const selected = elements.commandList.children[selectedIndex];
    if (selected instanceof HTMLElement && "scrollIntoView" in selected) {
      selected.scrollIntoView({ block: "nearest" });
    }
  };

  const filter = (query: string): void => {
    const normalized = query.trim().toLowerCase();
    filtered =
      normalized === ""
        ? [...commands]
        : commands.filter((command) =>
            command.label.toLowerCase().includes(normalized),
          );
    selectedIndex = 0;
    render();
  };

  const run = (command: Command): void => {
    closeCommandPalette();
    command.run();
  };

  bindVisibility(elements.commandPalette, commandPaletteOpen);

  bindEvent(elements.commandPalette, "click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.classList.contains("palette-backdrop")) {
      closeCommandPalette();
    }
  });

  elements.commandInput.addEventListener("input", () => {
    filter(elements.commandInput.value);
  });

  elements.commandInput.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex + 1) % filtered.length;
          render();
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (filtered.length > 0) {
          selectedIndex = (selectedIndex - 1 + filtered.length) % filtered.length;
          render();
        }
        break;
      case "Enter": {
        event.preventDefault();
        const command = filtered[selectedIndex];
        if (command !== undefined) {
          run(command);
        }
        break;
      }
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        closeCommandPalette();
        break;
      default:
        break;
    }
  });

  effect(() => {
    if (!commandPaletteOpen.get()) {
      return;
    }
    elements.commandInput.value = "";
    filter("");
    void Promise.resolve().then(() => {
      elements.commandInput.focus();
    });
  });
}
