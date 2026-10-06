import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
from typing import List, Dict, Any
from app.schemas.document import PDFTextSpan, BoundingBox

class LocalOCRPipeline:
    @staticmethod
    def is_scanned_page(page: fitz.Page) -> bool:
        """
        Checks if page has minimal or zero text spans (likely a scanned image PDF).
        """
        text = page.get_text().strip()
        return len(text) < 20

    @staticmethod
    def perform_ocr_on_page(page: fitz.Page, page_num: int) -> List[PDFTextSpan]:
        """
        Runs OCR on page image using Tesseract or PyMuPDF OCR to extract text spans and bounding boxes.
        """
        spans: List[PDFTextSpan] = []
        try:
            # Render high-res image of page
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_bytes))

            # Run pytesseract image_to_data
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            n_boxes = len(data['text'])

            # Scale factor from 150 DPI back to 72 DPI PDF point space
            scale = 72.0 / 150.0

            for i in range(n_boxes):
                text = data['text'][i].strip()
                if not text:
                    continue

                x = data['left'][i] * scale
                y = data['top'][i] * scale
                w = data['width'][i] * scale
                h = data['height'][i] * scale

                spans.append(PDFTextSpan(
                    id=f"ocr_span_{page_num}_{len(spans)}",
                    page_number=page_num,
                    text=text,
                    bbox=BoundingBox(x0=x, y0=y, x1=x+w, y1=y+h),
                    font_name="OCR-Detected",
                    font_size=max(8.0, round(h, 1)),
                    color="#000000"
                ))

        except Exception as e:
            # Fallback if tesseract binary is not installed on OS path
            pix = page.get_pixmap(dpi=150)
            text = f"Scanned page {page_num} (OCR Binary not present)"
            spans.append(PDFTextSpan(
                id=f"ocr_span_{page_num}_0",
                page_number=page_num,
                text=text,
                bbox=BoundingBox(x0=50, y0=50, x1=400, y1=70),
                font_name="Helvetica",
                font_size=12.0,
                color="#000000"
            ))

        return spans
