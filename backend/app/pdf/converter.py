import os
import io
import zipfile
import fitz  # PyMuPDF
from docx import Document as DocxDocument
from docx.shared import Pt, Inches
import markdown as md_lib
from bs4 import BeautifulSoup
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from PIL import Image

class DocumentConverter:
    @staticmethod
    def pdf_to_docx(pdf_filepath: str, output_filepath: str, mode: str = "editable") -> str:
        """
        Converts PDF to DOCX using PyMuPDF and python-docx.
        mode: 'editable' (semantic text blocks) or 'layout' (preserve position).
        """
        doc = fitz.open(pdf_filepath)
        docx = DocxDocument()

        for page in doc:
            # Extract text blocks
            blocks = page.get_text("blocks")
            for b in blocks:
                text = b[4].strip()
                if text:
                    docx.add_paragraph(text)

            # Extract images and embed
            for img_info in page.get_image_info(xrefs=True):
                xref = img_info.get("xref")
                if xref:
                    try:
                        base_img = doc.extract_image(xref)
                        img_bytes = base_img["image"]
                        img_stream = io.BytesIO(img_bytes)
                        docx.add_picture(img_stream, width=Inches(4.0))
                    except Exception:
                        pass

        docx.save(output_filepath)
        doc.close()
        return output_filepath

    @staticmethod
    def pdf_to_txt(pdf_filepath: str, output_filepath: str) -> str:
        doc = fitz.open(pdf_filepath)
        text_content = []
        for pno, page in enumerate(doc):
            text_content.append(f"--- Page {pno + 1} ---")
            text_content.append(page.get_text())

        with open(output_filepath, "w", encoding="utf-8") as f:
            f.write("\n\n".join(text_content))

        doc.close()
        return output_filepath

    @staticmethod
    def pdf_to_markdown(pdf_filepath: str, output_filepath: str) -> str:
        doc = fitz.open(pdf_filepath)
        md_lines = []

        for pno, page in enumerate(doc):
            md_lines.append(f"## Page {pno + 1}\n")
            blocks = page.get_text("blocks")
            for b in blocks:
                text = b[4].strip()
                if not text:
                    continue
                # Heuristic heading detection based on line length
                if len(text) < 50 and "\n" not in text:
                    md_lines.append(f"### {text}\n")
                else:
                    md_lines.append(f"{text}\n")

        with open(output_filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(md_lines))

        doc.close()
        return output_filepath

    @staticmethod
    def pdf_to_html(pdf_filepath: str, output_filepath: str) -> str:
        doc = fitz.open(pdf_filepath)
        html_parts = ["<!DOCTYPE html><html><head><meta charset='utf-8'><title>Converted Document</title></head><body style='font-family:sans-serif; max-width:800px; margin: auto; padding:20px;'>"]

        for pno, page in enumerate(doc):
            html_parts.append(f"<div style='border-bottom: 2px solid #ccc; padding: 20px 0;'><h2>Page {pno+1}</h2>")
            html_parts.append(page.get_text("html"))
            html_parts.append("</div>")

        html_parts.append("</body></html>")
        doc.close()

        with open(output_filepath, "w", encoding="utf-8") as f:
            f.write("\n".join(html_parts))

        return output_filepath

    @staticmethod
    def pdf_to_images_zip(pdf_filepath: str, output_zip_filepath: str, format_ext: str = "png") -> str:
        doc = fitz.open(pdf_filepath)
        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for pno, page in enumerate(doc):
                pix = page.get_pixmap(dpi=200)
                img_bytes = pix.tobytes(format_ext)
                zip_file.writestr(f"page_{pno + 1}.{format_ext}", img_bytes)

        doc.close()
        with open(output_zip_filepath, "wb") as f:
            f.write(zip_buffer.getvalue())

        return output_zip_filepath

    @staticmethod
    def docx_to_pdf(docx_filepath: str, output_filepath: str) -> str:
        docx = DocxDocument(docx_filepath)
        doc = SimpleDocTemplate(output_filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        for p in docx.paragraphs:
            text = p.text.strip()
            if text:
                story.append(Paragraph(text, styles['Normal']))
                story.append(Spacer(1, 8))

        doc.build(story)
        return output_filepath

    @staticmethod
    def images_to_pdf(image_filepaths: list[str], output_filepath: str) -> str:
        doc = fitz.open()
        for img_path in image_filepaths:
            img = Image.open(img_path)
            w, h = img.size
            page = doc.new_page(width=w, height=h)
            page.insert_image(fitz.Rect(0, 0, w, h), filename=img_path)

        doc.save(output_filepath)
        doc.close()
        return output_filepath

    @staticmethod
    def markdown_to_pdf(md_filepath: str, output_filepath: str) -> str:
        with open(md_filepath, "r", encoding="utf-8") as f:
            md_text = f.read()

        html_text = md_lib.markdown(md_text)
        doc = SimpleDocTemplate(output_filepath, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []

        soup = BeautifulSoup(html_text, 'html.parser')
        for elem in soup.find_all(['p', 'h1', 'h2', 'h3', 'li']):
            story.append(Paragraph(elem.get_text(), styles['Normal']))
            story.append(Spacer(1, 6))

        doc.build(story)
        return output_filepath

    @staticmethod
    def convert_document(source_filepath: str, source_format: str, target_format: str, output_filepath: str, mode: str = "editable") -> str:
        src_fmt = source_format.lower()
        tgt_fmt = target_format.lower()

        if src_fmt == "pdf":
            if tgt_fmt == "docx":
                return DocumentConverter.pdf_to_docx(source_filepath, output_filepath, mode)
            elif tgt_fmt == "txt":
                return DocumentConverter.pdf_to_txt(source_filepath, output_filepath)
            elif tgt_fmt == "md" or tgt_fmt == "markdown":
                return DocumentConverter.pdf_to_markdown(source_filepath, output_filepath)
            elif tgt_fmt == "html":
                return DocumentConverter.pdf_to_html(source_filepath, output_filepath)
            elif tgt_fmt in ["png", "jpg", "images"]:
                return DocumentConverter.pdf_to_images_zip(source_filepath, output_filepath, "png" if tgt_fmt == "png" else "jpeg")

        elif src_fmt == "docx" and tgt_fmt == "pdf":
            return DocumentConverter.docx_to_pdf(source_filepath, output_filepath)

        elif src_fmt in ["md", "markdown"] and tgt_fmt == "pdf":
            return DocumentConverter.markdown_to_pdf(source_filepath, output_filepath)

        raise ValueError(f"Conversion from {source_format} to {target_format} is not supported.")
