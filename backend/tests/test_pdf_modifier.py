import os
import fitz
import pytest
from app.pdf.extractor import PDFExtractor
from app.pdf.modifier import PDFModifier

@pytest.fixture
def sample_pdf(tmp_path):
    pdf_path = str(tmp_path / "sample.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text(fitz.Point(100, 100), "Hello PaperForge 2025", fontsize=14, color=(0, 0, 0))
    doc.save(pdf_path)
    doc.close()
    return pdf_path

def test_extract_and_replace_text(sample_pdf, tmp_path):
    output_path = str(tmp_path / "output.pdf")

    # Extract original
    doc_model = PDFExtractor.extract_document(sample_pdf, "doc1", "sample.pdf")
    assert doc_model.page_count == 1
    assert "Hello PaperForge 2025" in doc_model.pages[0].spans[0].text

    # Execute replace_text operation
    ops = [
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "2025",
            "replacement_text": "2026",
            "font_size": 14.0
        }
    ]

    success = PDFModifier.apply_operations(sample_pdf, output_path, ops)
    assert success is True

    # Re-extract and verify
    modified_model = PDFExtractor.extract_document(output_path, "doc1", "sample.pdf")
    text_content = " ".join([s.text for s in modified_model.pages[0].spans])
    assert "2026" in text_content
