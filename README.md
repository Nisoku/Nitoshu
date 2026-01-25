# Nitoshu

Nitoshu is a minimal, lightning-fast, installable text/code editor for the browser, built as a web app you can actually _use_. Quick open, save, drag-and-drop, and full offline support. Designed for easy last-minute coding (not judging), tweaking, and note-jotting, everywhere you take your browser.

---

## What's with the Name?

I love the name "Nitoshu"!  
It's a mashup inspired by Japanese:

- **Nisoku** (from _Nisshoku_, 日食 — "Eclipse") – what the organization name is
- **Netto** (ネット — "Net", as in Internet/Web) – available on the web
- **Henshū** (編集 — "Editing") – making, changing, customizing... It's a text editor.

Japanese is so cool :D

---

## Features

- Edit text or code instantly, right in your browser
- Open files (including drag & drop support)
- Save files locally with a single click (or <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd>)
- Remembers and displays file name
- Live character count and status bar
- Clean, responsive UI (try it on mobile, too)
- [PWA](https://web.dev/progressive-web-apps/) support (installable, offline-friendly)
- Supports a huge array of text/code file extensions via the manifest
- No dependencies except [Vite](https://vitejs.dev/) (for building) and minimal plugins

---

## Getting Started

Clone and launch in your terminal:

```bash
git clone https://github.com/Nisoku/Nitoshu.git
cd Nitoshu/Build
npm install
npm run dev
```

Your app will be live at [localhost:5173](http://localhost:5173).

No install needed for basic use!  
Just open the latest [single-file](https://github.com/Nisoku/Nitoshu/actions/workflows/single-file.yml) build directly in your browser, or open the deployed site and install for it to *just work* offline.

---

## Usage

- Type, paste, or drag in a file.
- Use <kbd>Open File</kbd> or drop a text/code file to edit.
- Use <kbd>Save File</kbd> or <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> to save.
- Edit the filename mid-session as you like!

---

## PWAs and File Handling

- Install Nitoshu as a PWA ("Add to Home Screen"/"Install").
- Open compatible text/code files directly via OS file handlers if your browser/platform supports it (check `vite.config.mjs` for all supported types, there's a LOT).

---

## Tech Stack

- [Vite](https://vitejs.dev/) build tool
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- [vite-plugin-singlefile](https://github.com/saf33r/vite-plugin-singlefile) (for a single, portable HTML build)
- Zero external JS dependencies in the app code itself

---

## License

MIT
