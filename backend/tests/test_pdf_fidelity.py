import os
import fitz
import pytest
from app.pdf.extractor import PDFExtractor
from app.pdf.modifier import PDFModifier

@pytest.fixture
def standard_font_pdf(tmp_path):
    pdf_path = str(tmp_path / "fixture_standard_fonts.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text(fitz.Point(100, 100), "Helvetica Line 1", fontsize=12, fontname="helv")
    page.insert_text(fitz.Point(100, 140), "Times-Roman Line 2", fontsize=12, fontname="tiro")
    page.insert_text(fitz.Point(100, 180), "Courier Code Line 3", fontsize=12, fontname="cour")
    doc.save(pdf_path)
    doc.close()
    return pdf_path

@pytest.fixture
def subset_font_pdf(tmp_path):
    pdf_path = str(tmp_path / "fixture_subset_fonts.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    # PyMuPDF creates subsetted font resource e.g. ABCDEE+Helvetica-Bold
    page.insert_text(fitz.Point(100, 100), "CONFIDENTIAL SUBSET TEXT 2025", fontsize=14, fontname="hebo")
    doc.save(pdf_path)
    doc.close()
    return pdf_path

def test_subset_font_detection(subset_font_pdf):
    doc_model = PDFExtractor.extract_document(subset_font_pdf, "doc_subset", "fixture_subset_fonts.pdf")
    span = doc_model.pages[0].spans[0]
    assert span.font_family == "Helvetica"
    assert span.is_bold is True
    assert doc_model.document_fonts is not None

def test_round_trip_standard_font_editing(standard_font_pdf, tmp_path):
    output_pdf = str(tmp_path / "round_trip_standard.pdf")

    # 1. Open and extract
    doc_model = PDFExtractor.extract_document(standard_font_pdf, "doc_rt", "fixture_standard_fonts.pdf")
    assert doc_model.page_count == 1

    # 2. Modify existing text span
    ops = [
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "Helvetica Line 1",
            "replacement_text": "Helvetica Line Modified 2026",
            "font_family": "Helvetica",
            "font_size": 12.0
        }
    ]

    success = PDFModifier.apply_operations(standard_font_pdf, output_pdf, ops)
    assert success is True

    # 3. Reopen exported PDF and programmatically verify actual PDF resources
    reopened = fitz.open(output_pdf)
    text_page_1 = reopened[0].get_text()
    reopened.close()

    # Assert target replacement is present and unaffected text (Line 2 & Line 3) remains valid
    assert "Helvetica Line Modified 2026" in text_page_1
    assert "Times-Roman Line 2" in text_page_1
    assert "Courier Code Line 3" in text_page_1

def test_real_resume_acceptance_workflow(tmp_path):
    """
    Section 31: Real Resume Acceptance Test
    End-to-end multi-step modification of a multi-page resume PDF followed by round-trip verification.
    """
    resume_source = str(tmp_path / "resume_source.pdf")
    resume_export = str(tmp_path / "resume_export.pdf")

    # Build 2-page Resume PDF fixture
    doc = fitz.open()
    p1 = doc.new_page(width=612, height=792)
    p1.insert_text(fitz.Point(72, 100), "ALEX MERCER", fontsize=24, fontname="hebo")
    p1.insert_text(fitz.Point(72, 130), "AI ENGINEER & SOFTWARE ARCHITECT", fontsize=12, fontname="hebo")
    p1.insert_text(fitz.Point(72, 170), "EXPERIENCE", fontsize=14, fontname="hebo")
    p1.insert_text(fitz.Point(72, 195), "Lead AI Architect - Example Corp (2020-2025)", fontsize=11, fontname="tiro")
    p1.insert_text(fitz.Point(72, 220), "Built local-first PDF processing pipelines.", fontsize=11, fontname="tiro")
    p1.insert_text(fitz.Point(72, 280), "CONFIDENTIAL-PHONE-999-000-1111", fontsize=10, fontname="cour")

    p2 = doc.new_page(width=612, height=792)
    p2.insert_text(fitz.Point(72, 100), "EDUCATION & CERTIFICATIONS", fontsize=14, fontname="hebo")
    p2.insert_text(fitz.Point(72, 130), "B.S. Computer Science - State University", fontsize=11, fontname="tiro")
    doc.save(resume_source)
    doc.close()

    # Step 1: Execute sequence of operations (Edit text, Move, Insert text, Highlight, Redact, Add page)
    ops = [
        # Edit text: "AI ENGINEER" -> "AI ENGINEERING DIRECTOR"
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "AI ENGINEER & SOFTWARE ARCHITECT",
            "replacement_text": "AI ENGINEERING DIRECTOR",
            "font_family": "Helvetica",
            "is_bold": True,
            "font_size": 13.0
        },
        # Insert text: New skills line
        {
            "operation_type": "insert_text",
            "page_number": 1,
            "text": "Skills: Python, PyMuPDF, TypeScript, Next.js",
            "x": 72,
            "y": 245,
            "font_size": 11.0,
            "font_family": "Helvetica"
        },
        # Redact confidential phone number
        {
            "operation_type": "redact_region",
            "page_number": 1,
            "bbox": {"x0": 65, "y0": 265, "x1": 320, "y1": 295},
            "fill_color_hex": "#000000"
        },
        # Highlight experience section
        {
            "operation_type": "highlight_text",
            "page_number": 1,
            "target_text": "EXPERIENCE",
            "color_hex": "#ffff00"
        },
        # Add blank page at end
        {
            "operation_type": "add_blank_page",
            "page_number": 2,
            "width": 612.0,
            "height": 792.0
        }
    ]

    success = PDFModifier.apply_operations(resume_source, resume_export, ops)
    assert success is True

    # Step 2: Programmatically inspect exported PDF resources
    export_doc = fitz.open(resume_export)
    assert len(export_doc) == 3  # Page count increased to 3

    p1_text = export_doc[0].get_text()
    assert "AI ENGINEERING DIRECTOR" in p1_text
    assert "Skills: Python, PyMuPDF, TypeScript, Next.js" in p1_text
    assert "CONFIDENTIAL-PHONE-999-000-1111" not in p1_text  # True redaction verified

    # Unaffected content on Page 1 & Page 2 remains intact
    assert "ALEX MERCER" in p1_text
    assert "Lead AI Architect" in p1_text

    p3_text = export_doc[2].get_text()
    assert "EDUCATION & CERTIFICATIONS" in p3_text

    export_doc.close()
