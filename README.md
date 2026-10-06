# PaperForge — AI-Native PDF Editor (V3.2 Web/PWA Edition)

PaperForge is a production-quality, local-first web application and PWA for viewing, directly editing, annotating, and AI-assisted manipulation of PDF documents while strictly preserving PDF typography and document fidelity.

## Key Architectural Principle

> **The AI never directly manipulates raw PDF bytes.**
> 
> The AI inspects document structure and produces validated, typed JSON editing operations (`EditOperation`). A deterministic Python backend (powered by PyMuPDF) executes those operations against the PDF to generate new revisions.

---

## Capabilities & Features

### 1. Real PDF Fidelity & Font Preservation Engine
- **Document Font Discovery**: Automatically extracts and categorizes all PDF font resources used in the document.
- **Subset Font Detection**: Identifies subset font prefixes (e.g., `ABCDEE+Aptos-Bold` → Family: `Aptos`, Variant: `Bold`, Base Name: `Aptos-Bold`).
- **Typography Preservation**: Retains font weight, italic state, font size, color, alignment, and baseline position during text replacement.
- **Font Fallback UX**: Clear UI indicator when a subset or missing font is substituted with a standard fallback (e.g., `Inter` / `Helvetica`).
- **Floating Formatting Toolbar**: Contextual bar floating directly above active text selections with font picker, size steppers, style toggles, and color controls.

### 2. Full Object-Level PDF Editing
- **Text Objects**: Edit, replace, style, move, resize, align, and add new text boxes.
- **Numeric Precision**: Properties bar with exact X, Y, Width, and Height controls.
- **Images**: Insert, scale, move, rotate, set opacity, duplicate, and delete.
- **Shapes**: Rectangle, ellipse, line, and arrow shapes with customizable stroke and fill colors.
- **Signature Ink Stamps**: Interactive signature pad for creating and stamping visual signature ink drawings.
- **Form Fields**: Edit interactive PDF text fields and checkboxes without corrupting PDF widget structures.
- **Page Operations**: Add blank pages, reorder, rotate (90°), duplicate, and delete pages.
- **Annotations**: Highlight text, underline, strikeout, and freehand drawing.
- **True Redaction**: Vector and text content removal from underlying PDF dictionaries (not visual overlay masking).

### 3. Privacy, Offline & Local Architecture
- **Local Processing**: Core document viewing, editing, conversion, and OCR execute locally on your machine.
- **PWA & Offline Execution**: Full Progressive Web App support with service worker app shell caching. Service worker explicitly bypasses private API endpoints.
- **Provider Status Badges**: Clear UI indicators for `● Local` execution, `● Offline` state, `Local AI (Ollama)`, or `Cloud AI (Gemini)`.
- **Optional AI**: Supports Ollama (`qwen2.5-coder`) for 100% offline local AI editing, or Google Gemini API when configured. Core editing functions fully without AI enabled.

### 4. Conversion & OCR Pipeline
- **Formats Supported**: PDF → DOCX, TXT, Markdown, HTML, Images. Images/DOCX/Markdown → PDF.
- **OCR Engine**: Tesseract integration for text recognition on scanned PDFs with graceful fallback when dependencies are missing.

---

## Monorepo Structure

```text
paperforge/
│
├── frontend/             # Next.js 16 + React 19 + TypeScript + Tailwind CSS
│   ├── app/              # Next.js App Router
│   ├── components/       # UI components (Navbar, FormattingToolbar, PropertiesBar, Viewer, AI Chat)
│   ├── lib/              # PDF Coordinate conversion & REST API client
│   ├── public/           # PWA manifest & sw.js service worker
│   ├── stores/           # Zustand state managers (usePdfStore, useAiStore)
│   └── types/            # TypeScript interfaces (pdf.ts, operations.ts)
│
├── backend/              # Python FastAPI + PyMuPDF (fitz) + SQLAlchemy
│   ├── app/
│   │   ├── api/          # REST API endpoints (documents, operations, ai, conversion)
│   │   ├── ai/           # AI Provider abstraction (GeminiProvider, OllamaProvider)
│   │   ├── pdf/          # PyMuPDF extractor, modifier engine & subset font parser
│   │   ├── schemas/      # Pydantic schemas for document model, fonts & operations
│   │   ├── services/     # Document & AI services
│   │   └── validation/   # Operation validator
│   └── tests/            # Pytest test suite (fidelity, redaction, AI, conversion)
│
├── docs/                 # Documentation & Tauri Desktop Readiness Roadmap
│   └── TAURI_DESKTOP_READINESS.md
├── data/                 # SQLite database & PDF revision storage
└── README.md
```

---

## Explicit Technical Limitations

1. **Outlined Vector Text**: PDF text that has been converted to pure vector outlines cannot be parsed as text spans and must be edited using shape tools.
2. **Cryptographic Signatures**: Signature drawings are visual image stamps; digital PKI certificate signing is not implemented.
3. **Missing Subset Font Re-embedding**: When editing text in a PDF with incomplete embedded font glyphs, standard clean fallbacks (`Inter`/`Helvetica`) are substituted to prevent PDF file corruption.

---

## Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Run test suite:
```bash
python -m pytest
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Future Roadmap
- **V4 Tauri Desktop Application**: Packaging PaperForge into a native desktop executable via Tauri v2. See [`docs/TAURI_DESKTOP_READINESS.md`](file:///c:/Users/HP/OneDrive/Documents/AI-native%20PDF%20Editor/docs/TAURI_DESKTOP_READINESS.md) for complete desktop architecture documentation.
