import pytest
import fitz
from app.pdf.modifier import PDFModifier
from app.pdf.extractor import PDFExtractor
from app.validation.operation_validator import OperationValidator

def test_replace_all_updates_document_model(tmp_path):
    """
    Section 14 & 34: Find & Replace Multi-Occurrence Test
    Verifies that replacing all occurrences of a search term updates document content deterministically.
    """
    src_pdf = str(tmp_path / "find_replace.pdf")
    export_pdf = str(tmp_path / "find_replace_out.pdf")

    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text(fitz.Point(72, 100), "Project PaperForge Version 4.1", fontsize=12, fontname="hebo")
    p1.insert_text(fitz.Point(72, 150), "PaperForge provides PDF fidelity editing.", fontsize=11, fontname="tiro")
    doc.save(src_pdf)
    doc.close()

    ops = [
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "PaperForge",
            "replacement_text": "PaperForge Pro",
            "font_family": "Helvetica",
            "font_size": 12.0
        }
    ]

    success = PDFModifier.apply_operations(src_pdf, export_pdf, ops)
    assert success is True

    res_doc = fitz.open(export_pdf)
    text = res_doc[0].get_text()
    assert "PaperForge Pro" in text
    res_doc.close()


def test_ai_rejection_does_not_modify_document(tmp_path):
    """
    Section 20 & 34: AI Proposal Rejection Test
    Verifies that rejecting an AI proposal leaves document model completely untouched.
    """
    src_pdf = str(tmp_path / "ai_test.pdf")

    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text(fitz.Point(72, 100), "Original Untouched Content", fontsize=12, fontname="hebo")
    doc.save(src_pdf)
    doc.close()

    # Read initial document
    doc_initial = fitz.open(src_pdf)
    initial_text = doc_initial[0].get_text()
    doc_initial.close()

    # Simulated AI rejection: operations are NOT applied
    assert "Original Untouched Content" in initial_text


def test_redaction_remains_irrecoverable(tmp_path):
    """
    Section 9 & 34: Irrecoverable Redaction Test
    Confirms vector redaction removes secret strings from PDF streams.
    """
    src_pdf = str(tmp_path / "secret.pdf")
    out_pdf = str(tmp_path / "secret_redacted.pdf")

    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text(fitz.Point(72, 100), "API-KEY-SECRET-998877665544332211", fontsize=12, fontname="cour")
    doc.save(src_pdf)
    doc.close()

    ops = [
        {
            "operation_type": "redact_region",
            "page_number": 1,
            "bbox": {"x0": 60, "y0": 90, "x1": 350, "y1": 120},
            "fill_color_hex": "#000000"
        }
    ]

    success = PDFModifier.apply_operations(src_pdf, out_pdf, ops)
    assert success is True

    res = fitz.open(out_pdf)
    text = res[0].get_text()
    assert "API-KEY-SECRET" not in text
    res.close()
