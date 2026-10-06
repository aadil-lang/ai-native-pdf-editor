<div align="center">

# 🛠️ PaperForge

### Professional AI-Native, Local-First PDF & Document Workspace

  <p>
    PaperForge is a local-first web application and installable PWA for viewing, directly editing, annotating, and AI-assisted manipulation of PDF documents while strictly preserving document typography and structure.
  </p>

  <p>
    <strong>Local Processing Default • 100% Offline Capable • Zero Paywalls • Privacy-Preserving</strong>
  </p>

</div>

---

## 💡 Core Architectural Principle

> **The AI never directly manipulates raw PDF bytes.**
> 
> The AI functions strictly as an intent interpreter: it inspects document structure and generates validated, typed JSON editing operations (`EditOperation`). A deterministic Python engine powered by **PyMuPDF (`fitz`)** executes those operations against the PDF dictionary to generate new document revisions with full undo/redo capabilities.

---

## ✨ Features & Capabilities

### 🔤 Real PDF Fidelity & Font Preservation Engine
- **Document Font Discovery**: Indexes and categorizes all PDF font resources present in the document.
- **Subset Font Parsing**: Identifies subset font prefixes (e.g. `ABCDEE+Aptos-Bold` $\rightarrow$ Family: `Aptos`, Variant: `Bold`, Base: `Aptos-Bold`, Subset: `True`).
- **Typography Preservation**: Preserves font weight, italic state, font size, text color, baseline position, and alignment metadata during text replacements.
- **Honest Font Fallback UX**: Clear visual badges when an embedded subset font lacks glyphs, displaying standard fallbacks (`Inter` / `Helvetica`) without corrupting PDF streams.
- **Floating Formatting Toolbar**: Contextual bar floating directly above text selections with font picker, size steppers, style toggles, and color controls.

### 📐 Object-Level PDF Editing & Transformation
- **Text Objects**: Edit text in-place, format typography, adjust numeric X/Y/W/H positioning, align, and add new text boxes.
- **Images**: Insert, scale, move, rotate, set opacity, duplicate, and delete image objects.
- **Shapes**: Rectangle, ellipse, line, and arrow shapes with customizable stroke and fill colors.
- **Signature Ink Stamps**: HTML5 Canvas drawing pad for creating and stamping visual signature ink drawings.
- **Interactive Form Fields**: Update text fields and checkboxes while maintaining underlying PDF widget structures.
- **Page Operations**: Add blank pages, reorder, rotate (90°), duplicate, and delete pages.
- **Vector Redaction**: Permanent removal of sensitive text strings and underlying vector graphics from PDF page dictionaries (not visual overlay rectangles).

### 🖥️ Professional Workspace Shell
- **App Menu Navigation Bar**: Google Docs-style application menus (`File`, `Edit`, `View`, `Document`, `AI`, `Help`).
- **Command Palette (`Ctrl/Cmd + K`)**: Instant search and execution across all document editing actions.
- **Find & Replace (`Ctrl/Cmd + F`)**: Match count counter (`X of Y matches`), Next/Prev match navigation, single match `Replace`, and single-step undoable `Replace All`.
- **Keyboard-First Workflow**: Shortcuts for canvas tools (`V`, `T`, `H`, `D`, `R`), undo/redo (`Ctrl+Z` / `Ctrl+Y`), file open (`Ctrl+O`), and export (`Ctrl+Shift+S`).
- **Document Status & Unsaved Guard**: Real-time filename dirty state indicators (`Resume.pdf *`), `Saving...` / `Saved` badges, and `beforeunload` browser tab loss protection.

### 🔒 Privacy, Offline PWA & AI Integration
- **Local Processing**: Document viewing, editing, conversion, and OCR execute 100% locally on your machine.
- **Offline PWA Engine**: Progressive Web App with Service Worker (`sw.js`) app shell caching. Service worker explicitly bypasses `/api/` endpoints to protect private PDF payloads.
- **Provider Transparency**: Visible status badges (`● Local`, `● Offline`, `Local AI (Ollama)`, `Cloud AI (Gemini)`).
- **Optional AI Integration**: Supports 100% offline local Ollama models (`qwen2.5-coder`) or Google Gemini API. Core document editing functions fully without AI enabled.

### 🔄 Format Conversion & OCR Pipeline
- **Supported Export Formats**: PDF $\rightarrow$ DOCX, Plain Text (TXT), Markdown (MD), HTML, Images (PNG).
- **Supported Import Formats**: Images, DOCX, Markdown $\rightarrow$ PDF.
- **OCR Engine**: Tesseract integration for text recognition on scanned PDFs with graceful fallback messaging when dependencies are uninstalled.

---

## 🏗️ System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    PaperForge Workspace                     │
│                                                             │
│  React 19 / Next.js 16 App Router (Localhost / PWA Shell)   │
│                              │                              │
│                Zustand State & Coordinate Math              │
│                              │                              │
│           FastAPI Backend REST API (Port 8000)             │
│                              │                              │
│      PyMuPDF (fitz) Engine  │  SQLAlchemy Revision Storage │
│                              │                              │
│             Local Filesystem & SQLite Database              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Repository Structure

```text
paperforge/
│
├── frontend/             # Next.js 16 + React 19 + TypeScript + Tailwind CSS
│   ├── app/              # Next.js App Router & main workspace shell
│   ├── components/       # Component hierarchy
│   │   ├── Modals/       # Command Palette, FindReplace, Export, Settings, Shortcuts
│   │   └── PdfViewer/    # PDF canvas renderer, editing overlay, formatting toolbar
│   ├── lib/              # PDF coordinate math & REST API client
│   ├── public/           # PWA manifest & sw.js service worker
│   ├── stores/           # Zustand state management (usePdfStore, useAiStore)
│   └── types/            # TypeScript interfaces (pdf.ts, operations.ts)
│
├── backend/              # Python 3.12 FastAPI + PyMuPDF (fitz) + SQLAlchemy
│   ├── app/
│   │   ├── api/          # REST endpoints (documents, operations, ai, conversion)
│   │   ├── ai/           # AI Provider abstraction (GeminiProvider, OllamaProvider)
│   │   ├── pdf/          # PyMuPDF extractor, modifier engine & subset font parser
│   │   ├── schemas/      # Pydantic schemas for document model, fonts & operations
│   │   ├── services/     # Document & AI services
│   │   └── validation/   # Operation validator
│   └── tests/            # Pytest test suite (fidelity, redaction, AI, conversion, V4.2 UX)
│
├── docs/                 # Documentation & Engineering Reports
│   ├── PAPERFORGE_V4_2_USER_EXPERIENCE_REPORT.md
│   ├── PAPERFORGE_V4_1_REAL_WORLD_VALIDATION_REPORT.md
│   ├── TAURI_DESKTOP_READINESS.md
│   └── PAPERFORGE_PERFORMANCE.md
├── docker-compose.yml    # Docker environment deployment
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **Git**

### 1. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# Navigate to frontend
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Verification & Testing

### Run Backend Pytest Suite

```bash
cd backend
python -m pytest
```

*(Expected output: 23 passed / 23 total in ~0.60s)*

### Run Frontend Build & Typecheck

```bash
cd frontend
npm run build
```

*(Expected output: Compiled successfully via Turbopack with 0 TypeScript errors)*

---

## ⚠️ Explicit Technical Limitations

1. **Outlined Vector Text**: PDF text that has been converted to pure vector paths cannot be parsed as editable text spans and must be manipulated as path objects.
2. **Cryptographic Signatures**: Signature drawings are saved as visual PNG stamps; digital PKI certificate signing is excluded by design.
3. **Missing Subset Font Re-embedding**: When editing text in a PDF with incomplete embedded font glyphs, clean standard fallbacks (`Inter`/`Helvetica`) are substituted to prevent PDF stream corruption.

---

## 📄 License & Attribution

PaperForge is developed for local-first document processing. Powered by [PyMuPDF](https://pymupdf.readthedocs.io/), [Next.js](https://nextjs.org/), and [FastAPI](https://fastapi.tiangolo.com/).
