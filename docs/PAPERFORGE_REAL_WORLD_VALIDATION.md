# PaperForge Real-World Validation Matrix

## Overview
This document records test scenarios, expected outputs, observed behaviors, and results for representative real-world PDF categories.

---

## Scenario Matrix

### Category A — Simple Digital PDF
- **Test**: Open standard PDF document with selectable text, headings, and images. Edit heading text, move paragraph, export, and inspect.
- **Expected**: Text replacement preserves original font family (`Helvetica`) and weight; position updates accurately; unaffected paragraphs remain unchanged.
- **Observed**: PDF text edited cleanly; PyMuPDF stream contains updated text string; exported document reopens without layout distortion.
- **Result**: **PASS**

### Category B — Multi-Page Resume / CV
- **Test**: Multi-page resume fixture with headers, experience sections, contact lines, and skill lists. Edit position title (`AI ENGINEER` $\rightarrow$ `AI ENGINEERING DIRECTOR`), redact confidential phone string, insert new skills line, add a blank page.
- **Expected**: Header typography preserved; redacted text permanently removed from text stream; page count updated to 3.
- **Observed**: All assertions passed in `test_real_resume_acceptance_workflow`. Exported PDF text stream contains updated title and no trace of redacted string.
- **Result**: **PASS**

### Category C — Complex Typography & Subset Fonts
- **Test**: PDF with subset font prefix (`ABCDEE+Aptos-Bold`). Extract font resource, edit text span, export, and inspect font metadata.
- **Expected**: Prefix `ABCDEE+` stripped; font family `Aptos` and variant `Bold` identified; clean fallback applied when embedded glyphs are unavailable.
- **Observed**: `parse_font_resource` extracts family `Aptos` and variant `Bold` with `is_subset=True`. Typography preserved in exported file.
- **Result**: **PASS**

### Category D — Interactive Form Fields
- **Test**: PDF form with text input widgets and checkboxes. Update field value from backend operation (`update_form_field`), export, and reopen.
- **Expected**: Form widget structure preserved; field value updated in PDF dictionary.
- **Observed**: Form field updated cleanly; PyMuPDF retains PDF widget format.
- **Result**: **PASS**

### Category E — Vector & Text Redaction Security
- **Test**: Redact region containing sensitive string `CONFIDENTIAL-TEST-12345`. Export PDF and inspect raw text stream.
- **Expected**: Text and underlying vector stream permanently removed (not masked with opaque rectangle overlay).
- **Observed**: `res_doc[0].get_text()` contains 0 occurrences of redacted string. Verified in `test_redaction_removes_underlying_text_stream`.
- **Result**: **PASS**

### Category F — Scanned PDF & OCR Fallback
- **Test**: Scanned document. Run OCR pipeline. If Tesseract is missing, surface clear message without crashing.
- **Expected**: Graceful handling; non-crashing fallback UI message when OCR engine is uninstalled.
- **Observed**: Graceful exception handling catches missing dependencies cleanly.
- **Result**: **PASS**
