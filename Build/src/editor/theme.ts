import type { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

const darkHighlightStyle = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.moduleKeyword], color: "#ff7ab2" },
  { tag: [t.string, t.special(t.string), t.regexp], color: "#ffd479" },
  { tag: [t.number, t.bool, t.null], color: "#d9c97c" },
  {
    tag: [t.comment, t.lineComment, t.blockComment],
    color: "#7f8c98",
    fontStyle: "italic",
  },
  {
    tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName],
    color: "#82aaff",
  },
  { tag: [t.typeName, t.className, t.namespace], color: "#5dd8c0" },
  { tag: [t.propertyName], color: "#89ddff" },
  {
    tag: [t.operator, t.operatorKeyword, t.punctuation, t.separator],
    color: "#9aa0a6",
  },
  { tag: [t.tagName], color: "#ff7ab2" },
  { tag: [t.attributeName], color: "#ffd479" },
  { tag: [t.meta, t.processingInstruction], color: "#c792ea" },
  { tag: [t.variableName, t.definition(t.variableName)], color: "#f5f5f7" },
  { tag: t.invalid, color: "#ff5b5b" },
]);

export const darkEditorTheme: Extension = [
  EditorView.theme(
    {
      "&": { color: "#f5f5f7" },
      ".cm-cursor, .cm-dropCursor": { borderLeftColor: "#0a84ff" },
      ".cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: "#3a3a3c",
      },
      "&.cm-focused .cm-selectionBackground": { backgroundColor: "#48484a" },
    },
    { dark: true },
  ),
  syntaxHighlighting(darkHighlightStyle),
];
