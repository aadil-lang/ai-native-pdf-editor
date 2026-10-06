import os
import fitz
import pytest
from app.pdf.extractor import PDFExtractor
from app.pdf.modifier import PDFModifier

@pytest.fixture
def sample_pdf(tmp_path):
    pdf_path = str(tmp_path / "professional.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text(fitz.Point(100, 100), "Professional PDF Editing Header", fontsize=16, color=(0, 0, 0), fontname="hebo")
    page.insert_text(fitz.Point(100, 150), "Standard Body Paragraph Text 2025", fontsize=11, color=(0.2, 0.2, 0.2), fontname="tiro")
    doc.save(pdf_path)
    doc.close()
    return pdf_path

def test_font_discovery_and_preservation(sample_pdf, tmp_path):
    output_pdf = str(tmp_path / "font_preserved.pdf")

    # Extract initial model
    doc_model = PDFExtractor.extract_document(sample_pdf, "doc_prof", "professional.pdf")
    span_0 = doc_model.pages[0].spans[0]
    assert span_0.is_bold is True or "bold" in span_0.font_name.lower() or "hebo" in span_0.font_name.lower()

    # Execute replace_text operation preserving bold font style
    ops = [
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "Header",
            "replacement_text": "Title 2026",
            "font_family": "Helvetica",
            "is_bold": True,
            "font_size": 16.0
        }
    ]

    success = PDFModifier.apply_operations(sample_pdf, output_pdf, ops)
    assert success is True

    # Re-extract and verify text replaced & document valid
    re_extracted = PDFExtractor.extract_document(output_pdf, "doc_prof", "professional.pdf")
    full_text = " ".join([s.text for s in re_extracted.pages[0].spans])
    assert "Title 2026" in full_text

def test_add_signature_stamp(sample_pdf, tmp_path):
    output_pdf = str(tmp_path / "signature_stamped.pdf")

    # Minimal transparent PNG base64 string for signature
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    ops = [
        {
            "operation_type": "add_signature",
            "page_number": 1,
            "image_base64": dummy_b64,
            "x": 150,
            "y": 300,
            "width": 140,
            "height": 50
        }
    ]

    success = PDFModifier.apply_operations(sample_pdf, output_pdf, ops)
    assert success is True

    # Verify image stream created in output PDF
    doc = fitz.open(output_pdf)
    assert len(doc[0].get_images()) >= 1
    doc.close()

def test_move_object(sample_pdf, tmp_path):
    output_pdf = str(tmp_path / "moved_object.pdf")

    ops = [
        {
            "operation_type": "move_object",
            "page_number": 1,
            "object_id": "span_1_0",
            "object_type": "text",
            "new_x": 250,
            "new_y": 400,
            "text": "Moved Header Text",
            "original_bbox": {"x0": 100, "y0": 90, "x1": 350, "y1": 110}
        }
    ]

    success = PDFModifier.apply_operations(sample_pdf, output_pdf, ops)
    assert success is True

    doc = fitz.open(output_pdf)
    text = doc[0].get_text()
    assert "Moved Header Text" in text
    doc.close()
