import fitz
import pytest
from app.pdf.modifier import PDFModifier
from app.pdf.extractor import PDFExtractor

def test_true_redaction_security(tmp_path):
    # 1. Create a PDF containing sensitive secret text "CONFIDENTIAL-TEST-12345"
    source_pdf = str(tmp_path / "sensitive.pdf")
    redacted_pdf = str(tmp_path / "redacted.pdf")

    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    # Insert sensitive string
    page.insert_text(fitz.Point(100, 200), "CONFIDENTIAL-TEST-12345", fontsize=14, color=(0, 0, 0))
    doc.save(source_pdf)
    doc.close()

    # Verify original text extraction contains confidential secret
    orig_doc = fitz.open(source_pdf)
    assert "CONFIDENTIAL-TEST-12345" in orig_doc[0].get_text()
    orig_doc.close()

    # 2. Execute redact_region operation on target bounding box
    ops = [
        {
            "operation_type": "redact_region",
            "page_number": 1,
            "bbox": {"x0": 90, "y0": 180, "x1": 350, "y1": 220},
            "fill_color_hex": "#000000"
        }
    ]

    success = PDFModifier.apply_operations(source_pdf, redacted_pdf, ops)
    assert success is True

    # 3. Programmatically extract text from the exported redacted PDF
    redacted_doc = fitz.open(redacted_pdf)
    extracted_text = redacted_doc[0].get_text()
    redacted_doc.close()

    # 4. Strictly assert "CONFIDENTIAL-TEST-12345" is COMPLETELY SCRUBBED from document stream
    assert "CONFIDENTIAL-TEST-12345" not in extracted_text
    assert "CONFIDENTIAL" not in extracted_text
    assert "12345" not in extracted_text
