import os
import fitz
import pytest
from app.pdf.converter import DocumentConverter

@pytest.fixture
def sample_pdf(tmp_path):
    pdf_path = str(tmp_path / "sample.pdf")
    doc = fitz.open()
    page = doc.new_page(width=612, height=792)
    page.insert_text(fitz.Point(100, 100), "PaperForge Document Converter Test", fontsize=14, color=(0, 0, 0))
    doc.save(pdf_path)
    doc.close()
    return pdf_path

def test_pdf_to_txt(sample_pdf, tmp_path):
    txt_path = str(tmp_path / "output.txt")
    res = DocumentConverter.pdf_to_txt(sample_pdf, txt_path)
    assert os.path.exists(res)
    with open(res, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PaperForge Document Converter Test" in content

def test_pdf_to_markdown(sample_pdf, tmp_path):
    md_path = str(tmp_path / "output.md")
    res = DocumentConverter.pdf_to_markdown(sample_pdf, md_path)
    assert os.path.exists(res)
    with open(res, "r", encoding="utf-8") as f:
        content = f.read()
    assert "PaperForge Document Converter Test" in content

def test_pdf_to_html(sample_pdf, tmp_path):
    html_path = str(tmp_path / "output.html")
    res = DocumentConverter.pdf_to_html(sample_pdf, html_path)
    assert os.path.exists(res)
    with open(res, "r", encoding="utf-8") as f:
        content = f.read()
    assert "<html>" in content

def test_pdf_to_docx(sample_pdf, tmp_path):
    docx_path = str(tmp_path / "output.docx")
    res = DocumentConverter.pdf_to_docx(sample_pdf, docx_path)
    assert os.path.exists(res)
