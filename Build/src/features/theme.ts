import { derived, path, signal } from "@nisoku/sairin";
import { themeSetting } from "../state/settings";

export type ResolvedTheme = "light" | "dark";

const query = window.matchMedia("(prefers-color-scheme: dark)");

export const systemPrefersDark = signal<boolean>(
  path("ui", "systemPrefersDark"),
  query.matches,
);

query.addEventListener("change", (event) => {
  systemPrefersDark.set(event.matches);
});

export const resolvedTheme = derived(
  path("ui", "resolvedTheme"),
  (): ResolvedTheme => {
    const setting = themeSetting.get();
    if (setting === "system") {
      return systemPrefersDark.get() ? "dark" : "light";
    }
    return setting;
  },
);

export function applyTheme(theme: ResolvedTheme): void {
  document.documentElement.dataset.theme = theme;
}
