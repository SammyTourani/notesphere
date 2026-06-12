# NoteSphere

[![CI](https://github.com/SammyTourani/notesphere/actions/workflows/ci.yml/badge.svg)](https://github.com/SammyTourani/notesphere/actions/workflows/ci.yml)

A note-taking web app with a fully offline, in-browser grammar checker. Notes sync to Firebase, the editor is built on TipTap, and grammar checking runs entirely in the browser via a WASM engine with zero network calls.

## What makes it interesting: offline grammar checking

The grammar checker runs the [`nlprule`](https://github.com/bminixhofer/nlprule) rule engine compiled to WebAssembly. It loads in the browser, checks text locally, and never sends your writing to a server. The WASM binary and its rule/dictionary data ship as static assets under `public/` and `src/wasm/`.

The grammar controller is built around three intended "tiers", but only the first is wired up today:

- **Tier 1 — nlprule WASM (functional).** The only working grammar path. Runs in-browser, no network. Implemented in `src/features/grammar/engines/WasmEngine.js`.
- **Tier 2 — LanguageTool (not implemented).** A placeholder. The controller holds a stub whose `isAvailable()` always returns `false`; there is no LanguageTool integration in this codebase.
- **Tier 3 — GPT-4 (not implemented).** Reserved as a future "premium" path. No implementation exists.

See `src/features/grammar/core/GrammarController.js` for the tier orchestration.

## Features

These are present and working in the live app:

- **Authentication** — Firebase email/password, Microsoft OAuth, and guest mode.
- **Cloud sync** — Notes stored in Firestore with offline IndexedDB persistence, plus LocalStorage fallback.
- **Rich-text editor** — TipTap (ProseMirror) with bold, italic, underline, highlight, links, and images.
- **Offline grammar checking** — nlprule WASM, runs locally (see above).
- **Note management** — pin, trash, and restore.
- **Autosave** — notes save as you type.
- **Word count** — live count in the editor.
- **Theming** — dark and light modes.
- **Animations** — Framer Motion throughout the UI.

## Tech stack

- **Frontend:** React 19 + Vite
- **Editor:** TipTap (ProseMirror)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Backend:** Firebase (Authentication + Firestore)
- **Grammar:** nlprule, compiled to WebAssembly (runs in-browser)
- **Language:** JavaScript (ES modules)

## Getting started

### Prerequisites

- Node.js 18 or newer
- npm

### Setup

1. Clone and install:

   ```bash
   git clone https://github.com/SammyTourani/notesphere.git
   cd notesphere
   npm install
   ```

2. Configure Firebase:

   ```bash
   cp .env.example .env
   ```

   Fill in your Firebase web config values in `.env`. The variable names the build reads are listed in `.env.example`.

   > Note: the app currently initializes Firebase from hardcoded values in `src/core/config/firebase.config.js` rather than from these environment variables. If you want the `.env` values to take effect, that file needs to be wired to `import.meta.env`. This is left as-is intentionally; see "Project status" below.

3. Run the dev server:

   ```bash
   npm run dev
   ```

   The app runs on `http://localhost:3000` (configured in `vite.config.js`).

### Build

```bash
npm run build
```

The production build emits to `dist/`. The grammar WASM binary is large (~20 MB uncompressed, ~9 MB gzipped), so the build prints a chunk-size warning. That is expected.

## Project structure

```
src/
  core/        # config, state, services (auth, notes, storage)
  features/    # auth, editor, grammar, landing, notes, settings
  wasm/        # nlprule WASM bindings
  shared/      # shared UI, hooks, utils
public/        # WASM binary + dictionary/rules/frequency assets
mega-engine/   # standalone multi-engine grammar package (see below)
```

Additional architecture and contributor notes live in `ARCHITECTURE.md` and `DEVELOPER_GUIDE.md`.

## Project status and honest notes

This started as an experiment and carries some unfinished and experimental code:

- **`mega-engine/` is a separate, more ambitious grammar package.** It combines nlprule, Hunspell, SymSpell, write-good, and retext into a multi-engine pipeline. It is built (with its own TypeScript source, tests, and assets) but **not yet wired into the live app** — the running app uses the lighter `src/features/grammar/engines/WasmEngine.js` path instead.
- **Some files under `src/services/` are experimental and unwired** (alternative grammar engines and rule sets). They are not part of the live grammar path.
- **Firebase config is hardcoded** in `src/core/config/firebase.config.js`. The committed `.env` is not currently read by the app. (The Firebase web API key is public-by-design for client apps; access is meant to be controlled by Firestore/Storage security rules.)
- **No automated test harness is wired at the app level.** The `mega-engine/` package has its own tests.

## License

MIT. See [LICENSE](./LICENSE).
