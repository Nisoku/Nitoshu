import { Compartment, EditorState } from "@codemirror/state";
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
  highlightSelectionMatches,
  search,
  searchKeymap,
} from "@codemirror/search";
import {
  LanguageDescription,
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
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
import type { EditorAdapter } from "./adapter";

export class CodeMirrorEditor implements EditorAdapter {
  private readonly view: EditorView;
  private readonly listeners = new Set<(value: string) => void>();
  private readonly languageCompartment = new Compartment();
  private suppressChange = false;
  private languageToken = 0;

  constructor(container: HTMLElement) {
    this.view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: "",
        extensions: [
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
          this.languageCompartment.of([]),
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
        ],
      }),
    });
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

  focus(): void {
    this.view.focus();
  }

  onChange(listener: (value: string) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  setLanguageFromFilename(filename: string): void {
    void this.applyLanguage(filename);
  }

  private async applyLanguage(filename: string): Promise<void> {
    const token = ++this.languageToken;
    const description = LanguageDescription.matchFilename(languages, filename);

    let support: LanguageSupport | null = null;
    if (description !== null) {
      try {
        support = await description.load();
      } catch (error) {
        console.error(`Failed to load language support for ${filename}`, error);
      }
    }

    if (token !== this.languageToken) {
      return;
    }

    this.view.dispatch({
      effects: this.languageCompartment.reconfigure(
        support !== null ? [support] : [],
      ),
    });
  }
}
