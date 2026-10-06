import os
import time
import pytest
import fitz  # PyMuPDF
from app.pdf.modifier import PDFModifier
from app.pdf.extractor import PDFExtractor
from app.validation.operation_validator import OperationValidator

def test_redaction_removes_underlying_text_stream(tmp_path):
    """
    Section 9 & 26: Security Regression Test
    Verifies that redaction removes sensitive test strings from both visual text and underlying text stream.
    """
    src_pdf = str(tmp_path / "sensitive.pdf")
    redacted_pdf = str(tmp_path / "redacted.pdf")

    # Build fixture with sensitive string
    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text(fitz.Point(72, 100), "PUBLIC TITLE: PAPERFORGE DEMO", fontsize=14, fontname="hebo")
    p1.insert_text(fitz.Point(72, 140), "CONFIDENTIAL-TEST-12345", fontsize=12, fontname="cour")
    p1.insert_text(fitz.Point(72, 170), "SECRET-DATA-67890", fontsize=12, fontname="cour")
    doc.save(src_pdf)
    doc.close()

    # Redact sensitive region
    ops = [
        {
            "operation_type": "redact_region",
            "page_number": 1,
            "bbox": {"x0": 60, "y0": 130, "x1": 350, "y1": 185},
            "fill_color_hex": "#000000"
        }
    ]

    success = PDFModifier.apply_operations(src_pdf, redacted_pdf, ops)
    assert success is True

    # Inspect exported PDF stream
    res_doc = fitz.open(redacted_pdf)
    text_content = res_doc[0].get_text()

    assert "PUBLIC TITLE: PAPERFORGE DEMO" in text_content
    assert "CONFIDENTIAL-TEST-12345" not in text_content
    assert "SECRET-DATA-67890" not in text_content
    res_doc.close()


def test_subset_font_metadata_survives_roundtrip(tmp_path):
    """
    Section 17: Font Fidelity & Subset Font Detection Test
    Tests that subset font prefixes (e.g. ABCDEE+Aptos-Bold) are correctly parsed into family & variant.
    """
    res1 = PDFExtractor.parse_font_resource("ABCDEE+Aptos-Bold")
    assert res1.family == "Aptos"
    assert res1.variant == "Bold"
    assert res1.is_subset is True
    assert res1.base_name == "Aptos-Bold"

    res2 = PDFExtractor.parse_font_resource("Helvetica-Oblique")
    assert res2.family == "Helvetica"
    assert res2.variant == "Italic"
    assert res2.is_subset is False


def test_invalid_ai_operation_is_rejected():
    """
    Section 19: AI Failure Mode & Safety Validation Test
    Verifies that operations targeting invalid pages or missing required fields are cleanly rejected.
    """
    invalid_ops = [
        {
            "operation_type": "replace_text",
            "page_number": 99,  # Out of bounds for 2-page doc
            "target_text": "Hello",
            "replacement_text": "World"
        },
        {
            "operation_type": "insert_text",
            "page_number": 1,
            # Missing text field
        }
    ]

    is_valid, errors, validated = OperationValidator.validate_operations(invalid_ops, page_count=2)
    assert is_valid is False
    assert len(errors) == 2


def test_large_document_performance_and_fidelity(tmp_path):
    """
    Section 5: Large Document Performance & Page Operations Test
    Creates a 50-page PDF, performs text edits, page operations, and verifies export latency < 2.0s.
    """
    large_pdf = str(tmp_path / "large_50p.pdf")
    exported_pdf = str(tmp_path / "large_50p_export.pdf")

    doc = fitz.open()
    for i in range(1, 51):
        p = doc.new_page(width=612, height=792)
        p.insert_text(fitz.Point(72, 100), f"Page {i} Header - Document Section", fontsize=14, fontname="hebo")
        p.insert_text(fitz.Point(72, 150), f"Sample body text for page {i}.", fontsize=11, fontname="tiro")
    doc.save(large_pdf)
    doc.close()

    ops = [
        # Edit text on page 10
        {
            "operation_type": "replace_text",
            "page_number": 10,
            "target_text": "Page 10 Header - Document Section",
            "replacement_text": "Page 10 Header - MODIFIED SECTION",
            "font_family": "Helvetica",
            "font_size": 14.0
        },
        # Delete page 50
        {
            "operation_type": "delete_page",
            "page_number": 50
        }
    ]

    t0 = time.time()
    success = PDFModifier.apply_operations(large_pdf, exported_pdf, ops)
    elapsed = time.time() - t0

    assert success is True
    assert elapsed < 2.0  # Export completed in under 2 seconds for 50 pages

    res_doc = fitz.open(exported_pdf)
    assert len(res_doc) == 49
    assert "MODIFIED SECTION" in res_doc[9].get_text()
    res_doc.close()
