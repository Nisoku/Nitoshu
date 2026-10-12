import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  crosshairCursor,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  placeholder,
  rectangularSelection,
} from "@codemirror/view";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import {
  closeSearchPanel,
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap,
  searchPanelOpen,
} from "@codemirror/search";
import {
  LanguageDescription,
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  indentUnit,
  syntaxHighlighting,
  type LanguageSupport,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { languages } from "@codemirror/language-data";
import type { IndentSetting } from "../state/settings";
import type { EditorAdapter, EditorTheme } from "./adapter";
import { darkEditorTheme } from "./theme";

export interface LanguageOption {
  readonly id: string;
  readonly label: string;
}

export function getLanguageOptions(): LanguageOption[] {
  return languages
    .map((language) => ({ id: language.name, label: language.name }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export class CodeMirrorEditor implements EditorAdapter {
  private readonly view: EditorView;
  private readonly listeners = new Set<(value: string) => void>();
  private readonly languageCompartment = new Compartment();
  private readonly themeCompartment = new Compartment();
  private readonly indentCompartment = new Compartment();
  private readonly wrapCompartment = new Compartment();

  private suppressChange = false;
  private languageToken = 0;
  private currentSupport: LanguageSupport | null = null;
  private currentTheme: EditorTheme = "light";
  private currentIndent: IndentSetting = "2";
  private currentWordWrap = false;

  constructor(container: HTMLElement) {
    this.view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: "",
        extensions: this.buildExtensions(),
      }),
    });
  }

  private buildExtensions(): Extension[] {
    return [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(true),
      indentOnInput(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      highlightSelectionMatches(),
      search({ top: true }),
      placeholder("Type here or drag and drop a file..."),
      this.languageCompartment.of(
        this.currentSupport !== null ? [this.currentSupport] : [],
      ),
      this.themeCompartment.of(
        this.currentTheme === "dark" ? darkEditorTheme : [],
      ),
      this.indentCompartment.of(this.indentConfig(this.currentIndent)),
      this.wrapCompartment.of(
        this.currentWordWrap ? EditorView.lineWrapping : [],
      ),
      keymap.of([
        ...closeBracketsKeymap,
        ...defaultKeymap,
        ...searchKeymap,
        ...historyKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged || this.suppressChange) {
          return;
        }
        const value = update.state.doc.toString();
        for (const listener of this.listeners) {
          listener(value);
        }
      }),
    ];
  }

  private indentConfig(indent: IndentSetting): Extension {
    const size = indent === "tab" ? 4 : Number(indent);
    return [
      EditorState.tabSize.of(size),
      indentUnit.of(indent === "tab" ? "\t" : " ".repeat(size)),
    ];
  }

  getValue(): string {
    return this.view.state.doc.toString();
  }

  setValue(value: string): void {
    if (value === this.getValue()) {
      return;
    }
    this.suppressChange = true;
    try {
      this.view.dispatch({
        changes: { from: 0, to: this.view.state.doc.length, insert: value },
      });
    } finally {
      this.suppressChange = false;
    }
  }

  setDocument(value: string): void {
    this.suppressChange = true;
    try {
      this.view.setState(
        EditorState.create({ doc: value, extensions: this.buildExtensions() }),
      );
    } finally {
      this.suppressChange = false;
    }
  }

  focus(): void {
    this.view.focus();
  }

  toggleSearch(): void {
    if (searchPanelOpen(this.view.state)) {
      closeSearchPanel(this.view);
      this.view.focus();
      return;
    }
    this.view.focus();
    openSearchPanel(this.view);
  }

  onChange(listener: (value: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setLanguage(filename: string, languageId: string): void {
    void this.applyLanguage(filename, languageId);
  }

  setTheme(theme: EditorTheme): void {
    this.currentTheme = theme;
    this.view.dispatch({
      effects: this.themeCompartment.reconfigure(
        theme === "dark" ? darkEditorTheme : [],
      ),
    });
  }

  setIndent(indent: IndentSetting): void {
    this.currentIndent = indent;
    this.view.dispatch({
      effects:       this.indentCompartment.reconfigure(this.indentConfig(indent)),
    });
  }

  setWordWrap(enabled: boolean): void {
    if (enabled === this.currentWordWrap) {
      return;
    }
    this.currentWordWrap = enabled;
    this.view.dispatch({
      effects: this.wrapCompartment.reconfigure(
        enabled ? EditorView.lineWrapping : [],
      ),
    });
  }

  private async applyLanguage(
    filename: string,
    languageId: string,
  ): Promise<void> {
    const token = ++this.languageToken;
    const description =
      languageId !== ""
        ? LanguageDescription.matchLanguageName(languages, languageId, true)
        : LanguageDescription.matchFilename(languages, filename);

    let support: LanguageSupport | null = null;
    if (description !== null) {
      try {
        support = await description.load();
      } catch (error) {
        console.error(
          `Failed to load language support for ${
            languageId !== "" ? languageId : filename
          }`,
          error,
        );
      }
    }

    if (token !== this.languageToken) {
      return;
    }

    this.currentSupport = support;
    this.view.dispatch({
      effects: this.languageCompartment.reconfigure(
        support !== null ? [support] : [],
      ),
    });
  }
}
