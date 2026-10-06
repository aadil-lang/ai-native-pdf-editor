# PaperForge V3.2 — Tauri Desktop Readiness & Migration Architecture

## Overview
PaperForge V3.2 completes the web/PWA stabilization phase before packaging into a native desktop application using **Tauri v2**. This document outlines the architectural readiness, environmental mappings, and migration strategy from the web/PWA model to the Tauri desktop environment.

---

## Architecture Mapping

```text
┌────────────────────────────────────────────────────────┐
│                   PaperForge Desktop                   │
│                                                        │
│  React 19 / Next.js Frontend (Static Export / Webview)  │
│                           │                            │
│                  Tauri Rust IPC / Shell                │
│                           │                            │
│         Local FastAPI / PyMuPDF Engine Service          │
│                           │                            │
│           Local Filesystem & SQLite Storage            │
└────────────────────────────────────────────────────────┘
```

---

## 1. Web/PWA vs. Tauri Desktop Mapping

| Layer / Feature | Current Web / PWA (V3.2) | Future Tauri Desktop (V4) | Migration Strategy |
| :--- | :--- | :--- | :--- |
| **User Interface** | Next.js 16 App Router (Localhost) | Next.js SSG / Tauri Webview | Keep identical React UI components and Zustand state stores without modification. |
| **Document Backend** | FastAPI + PyMuPDF on `http://127.0.0.1:8000` | Embedded FastAPI PyInstaller sidecar OR Rust PyMuPDF binding | Run FastAPI backend process as a managed Tauri sidecar (`tauri-plugin-shell`). |
| **Storage & Revisions** | Local disk (`data/uploads/`, `data/paperforge.db`) | User AppData / Native OS Document Store | Map path resolution to Tauri `$APP_DATA_DIR` and `$DOCUMENT_DIR`. |
| **File Picker** | HTML `<input type="file">` | Native OS File Dialog (`@tauri-apps/plugin-dialog`) | Provide native open/save file dialogs while preserving file input fallback. |
| **Offline Engine** | Service Worker cache (`sw.js`) bypasses `/api` | Native local execution (Offline by default) | Direct sidecar communication removes reliance on browser HTTP CORS or SW caches. |
| **AI Processing** | Local Ollama / Optional Cloud Gemini | Local Ollama / Optional Cloud Gemini | Retain provider interface; allow Tauri sidecar to discover local Ollama port automatically. |

---

## 2. Decoupling Assumptions & Readiness Checklist

- [x] **No Hardcoded Absolute Remote URLs**: Frontend REST requests use relative API endpoints or configurable base URLs (`NEXT_PUBLIC_API_URL`).
- [x] **Service Worker Security**: Service Worker explicitly bypasses `/api` routes, preventing private PDF data from leaking into browser cache storage.
- [x] **Local Filesystem Isolation**: PDF byte operations and SQLite revisions are stored locally in isolated project/user directories.
- [x] **No `eval()` / Arbitrary Execution**: Strict Pydantic schema validation barriers for all AI-generated operations.
- [x] **Cross-Platform Compatibility**: Tested and verified under Windows, Chromium/Edge, and Firefox environment targets.

---

## 3. Recommended V4 Tauri Integration Plan

1. **Packaging Backend**: Bundle FastAPI backend using PyInstaller into a standalone executable sidecar binary for Windows, macOS, and Linux.
2. **Tauri Config**: Configure `tauri.conf.json` with sidecar binary entry `paperforge-engine`.
3. **Native File Integration**: Use `@tauri-apps/plugin-dialog` to support "Open With...", drag-and-drop from OS file manager, and native Save As dialogs.
4. **Auto-Updater**: Configure `@tauri-apps/plugin-updater` for offline-safe application releases.

---

## 4. Conclusion
PaperForge V3.2 is **fully decoupled and ready for V4 Tauri Desktop packaging** without requiring any structural changes to the PDF editing engine, object model, font fidelity layer, or React component tree.
