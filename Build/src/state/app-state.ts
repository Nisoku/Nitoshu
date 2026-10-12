import { Store } from "./store";
import type { AppState } from "../types";

export const DEFAULT_FILENAME = "Untitled.txt";

export const appStore = new Store<AppState>({
  content: "",
  filename: DEFAULT_FILENAME,
  dirty: false,
});
