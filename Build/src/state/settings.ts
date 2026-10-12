import { path, signal } from "@nisoku/sairin";

export type ThemeSetting = "system" | "light" | "dark";
export type IndentSetting = "2" | "4" | "tab";

export interface Settings {
  theme: ThemeSetting;
  indent: IndentSetting;
  wordWrap: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  indent: "2",
  wordWrap: false,
};

export const themeSetting = signal<ThemeSetting>(
  path("settings", "theme"),
  DEFAULT_SETTINGS.theme,
);

export const indentSetting = signal<IndentSetting>(
  path("settings", "indent"),
  DEFAULT_SETTINGS.indent,
);

export const wordWrapSetting = signal<boolean>(
  path("settings", "wordWrap"),
  DEFAULT_SETTINGS.wordWrap,
);

export const settingsOpen = signal<boolean>(path("ui", "settingsOpen"), false);

export const zenMode = signal<boolean>(path("ui", "zenMode"), false);

export function setZenMode(value: boolean): void {
  zenMode.set(value);
}

export function toggleZenMode(): void {
  zenMode.update((zen) => !zen);
}

export function toggleSettings(): void {
  settingsOpen.update((open) => !open);
}

export function closeSettings(): void {
  settingsOpen.set(false);
}

function isThemeSetting(value: unknown): value is ThemeSetting {
  return value === "system" || value === "light" || value === "dark";
}

function isIndentSetting(value: unknown): value is IndentSetting {
  return value === "2" || value === "4" || value === "tab";
}

export function applySettings(settings: Partial<Settings>): void {
  if (isThemeSetting(settings.theme)) {
    themeSetting.set(settings.theme);
  }
  if (isIndentSetting(settings.indent)) {
    indentSetting.set(settings.indent);
  }
  if (typeof settings.wordWrap === "boolean") {
    wordWrapSetting.set(settings.wordWrap);
  }
}

export function snapshotSettings(): Settings {
  return {
    theme: themeSetting.get(),
    indent: indentSetting.get(),
    wordWrap: wordWrapSetting.get(),
  };
}
