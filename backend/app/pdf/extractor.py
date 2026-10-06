import fitz  # PyMuPDF
import re
import uuid
import base64
from typing import List, Dict, Any, Optional, Set
from app.schemas.document import (
    PDFDocumentModel,
    PDFPage,
    PDFTextSpan,
    PDFImageObject,
    PDFAnnotationObject,
    PDFShapeObject,
    PDFFormFieldObject,
    PDFFontResource,
    BoundingBox,
)
from app.pdf.coordinates import rgb_float_to_hex

class PDFExtractor:
    @staticmethod
    def parse_font_resource(pdf_font_name: str) -> PDFFontResource:
        """
        Parses a PDF font resource name (e.g. 'ABCDEE+Aptos-Bold' or 'Helvetica-Oblique')
        and extracts base family, variant, subset status, and embedded resource information.
        """
        raw_name = pdf_font_name or "Helvetica"
        is_subset = False
        base_name = raw_name

        # Match 6 uppercase letters prefix followed by '+' e.g. ABCDEE+
        subset_match = re.match(r"^[A-Z]{6}\+(.+)$", raw_name)
        if subset_match:
            is_subset = True
            base_name = subset_match.group(1)

        # Parse variant (Bold, Italic, Regular)
        variant_parts = []
        name_lower = base_name.lower()

        if "bold" in name_lower or "hebo" in name_lower or "tibo" in name_lower or "cobo" in name_lower:
            variant_parts.append("Bold")
        if "italic" in name_lower or "oblique" in name_lower or "heit" in name_lower or "tiit" in name_lower or "coit" in name_lower:
            variant_parts.append("Italic")

        variant = " ".join(variant_parts) if variant_parts else "Regular"

        # Extract underlying clean family name (strip hyphenated variants e.g. Aptos-Bold -> Aptos)
        family = base_name.split("-")[0].split(",")[0]
        if family.lower() in ["helvetica", "helv", "arial"]:
            family = "Helvetica"
        elif family.lower() in ["times", "timesnewroman", "serif"]:
            family = "Times-Roman"
        elif family.lower() in ["courier", "mono"]:
            family = "Courier"

        return PDFFontResource(
            pdf_name=raw_name,
            base_name=base_name,
            family=family,
            variant=variant,
            is_subset=is_subset,
            is_embedded=True,
            source="embedded" if is_subset else "standard",
            available_for_editing=True
        )

    @staticmethod
    def extract_document(filepath: str, document_id: str, filename: str, current_revision: int = 0) -> PDFDocumentModel:
        """
        Parses a PDF file using PyMuPDF and extracts text spans with typography, font subsetting, images, form fields, and annotations.
        """
        doc = fitz.open(filepath)
        pages: List[PDFPage] = []
        doc_fonts_map: Dict[str, PDFFontResource] = {}

        # Scan document fonts from PyMuPDF font list
        for page in doc:
            font_list = page.get_fonts()
            for font_item in font_list:
                f_pdf_name = font_item[3] or font_item[4]
                if f_pdf_name and f_pdf_name not in doc_fonts_map:
                    doc_fonts_map[f_pdf_name] = PDFExtractor.parse_font_resource(f_pdf_name)

        for idx, page in enumerate(doc):
            page_num = idx + 1
            rect = page.rect
            width = rect.width
            height = rect.height
            rotation = page.rotation

            # Extract text blocks & spans with typography
            spans: List[PDFTextSpan] = []
            text_dict = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE | fitz.TEXT_PRESERVE_SPANS)
            for block in text_dict.get("blocks", []):
                if block.get("type") == 0:  # Text block
                    for line in block.get("lines", []):
                        for span in line.get("spans", []):
                            text = span.get("text", "")
                            if not text:
                                continue
                            bbox_tuple = span.get("bbox", (0, 0, 0, 0))
                            color_int = span.get("color", 0)
                            r = (color_int >> 16) & 0xFF
                            g = (color_int >> 8) & 0xFF
                            b = color_int & 0xFF
                            color_hex = f"#{r:02x}{g:02x}{b:02x}"

                            raw_font_name = span.get("font", "Helvetica")
                            flags = span.get("flags", 0)

                            font_res = PDFExtractor.parse_font_resource(raw_font_name)
                            if raw_font_name not in doc_fonts_map:
                                doc_fonts_map[raw_font_name] = font_res

                            is_bold = font_res.variant in ["Bold", "Bold Italic"] or bool(flags & 2)
                            is_italic = "Italic" in font_res.variant or bool(flags & 1)

                            spans.append(PDFTextSpan(
                                id=f"span_{page_num}_{len(spans)}",
                                page_number=page_num,
                                text=text,
                                bbox=BoundingBox(x0=bbox_tuple[0], y0=bbox_tuple[1], x1=bbox_tuple[2], y1=bbox_tuple[3]),
                                font_name=font_res.base_name,
                                font_family=font_res.family,
                                font_variant=font_res.variant,
                                pdf_font_resource=raw_font_name,
                                font_size=round(span.get("size", 12.0), 1),
                                color=color_hex,
                                is_bold=is_bold,
                                is_italic=is_italic,
                                is_subset_font=font_res.is_subset,
                                flags=flags
                            ))

            # Extract Images
            images: List[PDFImageObject] = []
            image_info_list = page.get_image_info(xrefs=True)
            for img_idx, img_info in enumerate(image_info_list):
                bbox_tuple = img_info.get("bbox", (0, 0, 0, 0))
                images.append(PDFImageObject(
                    id=f"img_{page_num}_{img_idx}",
                    page_number=page_num,
                    bbox=BoundingBox(x0=bbox_tuple[0], y0=bbox_tuple[1], x1=bbox_tuple[2], y1=bbox_tuple[3]),
                    width=img_info.get("width", 0),
                    height=img_info.get("height", 0),
                    ext=img_info.get("ext", "png"),
                    image_index=img_idx
                ))

            # Extract Annotations
            annotations: List[PDFAnnotationObject] = []
            annot = page.first_annot
            annot_idx = 0
            while annot:
                rect_annot = annot.rect
                annot_type_str = annot.type[1] if isinstance(annot.type, tuple) else str(annot.type)
                annot_color = annot.colors.get("stroke") or annot.colors.get("fill") or (1, 1, 0)
                color_hex = rgb_float_to_hex(*annot_color[:3]) if annot_color else "#ffff00"

                annotations.append(PDFAnnotationObject(
                    id=f"annot_{page_num}_{annot_idx}",
                    page_number=page_num,
                    type=annot_type_str.lower(),
                    bbox=BoundingBox(x0=rect_annot.x0, y0=rect_annot.y0, x1=rect_annot.x1, y1=rect_annot.y1),
                    color=color_hex,
                    content=annot.info.get("content", "")
                ))
                annot = annot.next
                annot_idx += 1

            # Extract Form Fields
            form_fields: List[PDFFormFieldObject] = []
            field_idx = 0
            for field in page.widgets():
                f_rect = field.rect
                f_type = "text"
                if field.field_type == fitz.PDF_WIDGET_TYPE_CHECKBOX:
                    f_type = "checkbox"
                elif field.field_type == fitz.PDF_WIDGET_TYPE_COMBOBOX:
                    f_type = "dropdown"

                form_fields.append(PDFFormFieldObject(
                    id=f"field_{page_num}_{field_idx}",
                    page_number=page_num,
                    name=field.field_name or f"field_{field_idx}",
                    type=f_type,
                    bbox=BoundingBox(x0=f_rect.x0, y0=f_rect.y0, x1=f_rect.x1, y1=f_rect.y1),
                    value=str(field.field_value or ""),
                    options=field.choice_values or []
                ))
                field_idx += 1

            pages.append(PDFPage(
                page_number=page_num,
                width=width,
                height=height,
                rotation=rotation,
                spans=spans,
                images=images,
                annotations=annotations,
                shapes=[],
                form_fields=form_fields,
                signatures=[]
            ))

        doc.close()

        return PDFDocumentModel(
            id=document_id,
            filename=filename,
            page_count=len(pages),
            current_revision_index=current_revision,
            pages=pages,
            document_fonts=list(doc_fonts_map.values())
        )

    @staticmethod
    def render_page_image(filepath: str, page_number: int, zoom: float = 1.5) -> bytes:
        doc = fitz.open(filepath)
        page = doc.load_page(page_number - 1)
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes
