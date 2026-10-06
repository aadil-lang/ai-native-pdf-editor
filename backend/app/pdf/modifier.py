import fitz  # PyMuPDF
import base64
from typing import Dict, Any, List
from app.schemas.document import BoundingBox
from app.pdf.coordinates import hex_to_rgb_float

class PDFModifier:
    @staticmethod
    def _resolve_font_name(font_family: str = "Helvetica", is_bold: bool = False, is_italic: bool = False) -> str:
        """
        Resolves standard PDF Base14 font name corresponding to typography properties.
        """
        family = (font_family or "Helvetica").lower()
        if "times" in family or "serif" in family:
            if is_bold and is_italic:
                return "tibi"
            elif is_bold:
                return "tibo"
            elif is_italic:
                return "tiit"
            return "tiro"
        elif "courier" in family or "mono" in family:
            if is_bold and is_italic:
                return "cobi"
            elif is_bold:
                return "cobo"
            elif is_italic:
                return "coit"
            return "cour"
        else:  # Helvetica / Arial / default
            if is_bold and is_italic:
                return "hebi"
            elif is_bold:
                return "hebo"
            elif is_italic:
                return "heit"
            return "helv"

    @staticmethod
    def apply_operations(source_filepath: str, target_filepath: str, operations: List[Dict[str, Any]]) -> bool:
        """
        Executes a sequence of EditOperations deterministically on the source PDF and saves to target_filepath.
        Preserves faithful typography, handles move/resize of objects, signature stamps, and form fields.
        """
        doc = fitz.open(source_filepath)

        for op in operations:
            op_type = op.get("operation_type")
            page_num = op.get("page_number", 1)

            if op_type not in ["reorder_pages", "add_blank_page"] and (page_num < 1 or page_num > len(doc)):
                continue

            page = doc[page_num - 1] if 1 <= page_num <= len(doc) else None

            if op_type == "replace_text":
                target = op.get("target_text", "")
                replacement = op.get("replacement_text", "")
                bbox_dict = op.get("bbox")

                matched_rects = []
                if bbox_dict:
                    matched_rects = [fitz.Rect(bbox_dict["x0"], bbox_dict["y0"], bbox_dict["x1"], bbox_dict["y1"])]
                elif target:
                    matched_rects = page.search_for(target)

                for rect in matched_rects:
                    font_size = op.get("font_size", 11.0)
                    color_rgb = hex_to_rgb_float(op.get("color_hex", "#000000")) if op.get("color_hex") else (0.0, 0.0, 0.0)

                    font_name = PDFModifier._resolve_font_name(
                        font_family=op.get("font_family") or op.get("font_name"),
                        is_bold=op.get("is_bold", False),
                        is_italic=op.get("is_italic", False)
                    )

                    # Redact original text area (fill with white to cover original rendering and scrub text stream)
                    page.add_redact_annot(rect, fill=(1, 1, 1))
                    page.apply_redactions()

                    # Insert replacement text preserving exact font styling
                    point = fitz.Point(rect.x0, rect.y1 - (rect.height * 0.2))
                    page.insert_text(point, replacement, fontsize=font_size, color=color_rgb, fontname=font_name)

            elif op_type == "insert_text":
                text = op.get("text", "")
                x = op.get("x", 50.0)
                y = op.get("y", 50.0)
                font_size = op.get("font_size", 12.0)
                color_hex = op.get("color_hex", "#000000")
                color_rgb = hex_to_rgb_float(color_hex)

                font_name = PDFModifier._resolve_font_name(
                    font_family=op.get("font_family") or op.get("font_name"),
                    is_bold=op.get("is_bold", False),
                    is_italic=op.get("is_italic", False)
                )

                point = fitz.Point(x, y)
                page.insert_text(point, text, fontsize=font_size, color=color_rgb, fontname=font_name)

            elif op_type == "delete_text":
                target = op.get("target_text", "")
                bbox_dict = op.get("bbox")
                matched_rects = []
                if bbox_dict:
                    matched_rects = [fitz.Rect(bbox_dict["x0"], bbox_dict["y0"], bbox_dict["x1"], bbox_dict["y1"])]
                elif target:
                    matched_rects = page.search_for(target)

                for rect in matched_rects:
                    page.add_redact_annot(rect, fill=(1, 1, 1))
                    page.apply_redactions()

            elif op_type == "move_object":
                new_x = op.get("new_x", 50.0)
                new_y = op.get("new_y", 50.0)
                orig_bbox = op.get("original_bbox")

                if orig_bbox:
                    old_rect = fitz.Rect(orig_bbox["x0"], orig_bbox["y0"], orig_bbox["x1"], orig_bbox["y1"])
                    w = old_rect.width
                    h = old_rect.height

                    # Clear old location
                    page.add_redact_annot(old_rect, fill=(1, 1, 1))
                    page.apply_redactions()

                    # Insert at new location
                    new_rect = fitz.Rect(new_x, new_y, new_x + w, new_y + h)
                    if op.get("text"):
                        page.insert_text(fitz.Point(new_x, new_y + h * 0.8), op.get("text"), fontsize=12, color=(0,0,0), fontname="helv")

            elif op_type == "resize_object":
                new_w = op.get("new_width", 100.0)
                new_h = op.get("new_height", 100.0)
                orig_bbox = op.get("original_bbox")

                if orig_bbox:
                    old_rect = fitz.Rect(orig_bbox["x0"], orig_bbox["y0"], orig_bbox["x1"], orig_bbox["y1"])
                    page.add_redact_annot(old_rect, fill=(1, 1, 1))
                    page.apply_redactions()

                    new_rect = fitz.Rect(old_rect.x0, old_rect.y0, old_rect.x0 + new_w, old_rect.y0 + new_h)
                    if op.get("image_base64"):
                        img_b64 = op.get("image_base64")
                        if "," in img_b64:
                            img_b64 = img_b64.split(",")[1]
                        page.insert_image(new_rect, stream=base64.b64decode(img_b64))

            elif op_type == "add_image" or op_type == "add_signature":
                img_b64 = op.get("image_base64", "")
                if "," in img_b64:
                    img_b64 = img_b64.split(",")[1]
                if img_b64:
                    img_data = base64.b64decode(img_b64)
                    x = op.get("x", 50.0)
                    y = op.get("y", 50.0)
                    w = op.get("width", 150.0)
                    h = op.get("height", 60.0)
                    rect = fitz.Rect(x, y, x + w, y + h)
                    page.insert_image(rect, stream=img_data)

            elif op_type == "add_annotation" or op_type == "highlight_text":
                annot_type = op.get("annotation_type", "highlight")
                bbox_dict = op.get("bbox")
                target_text = op.get("target_text")
                color_hex = op.get("color_hex", "#ffff00")
                color_rgb = hex_to_rgb_float(color_hex)

                rects = []
                if bbox_dict:
                    rects = [fitz.Rect(bbox_dict["x0"], bbox_dict["y0"], bbox_dict["x1"], bbox_dict["y1"])]
                elif target_text:
                    rects = page.search_for(target_text)

                for r in rects:
                    if annot_type == "underline":
                        annot = page.add_underline_annot(r)
                    elif annot_type == "strikeout":
                        annot = page.add_strikeout_annot(r)
                    else:
                        annot = page.add_highlight_annot(r)
                    annot.set_colors(stroke=color_rgb)
                    annot.update()

            elif op_type == "add_shape":
                shape_type = op.get("shape_type", "rectangle")
                stroke_hex = op.get("stroke_color_hex", "#000000")
                fill_hex = op.get("fill_color_hex")
                stroke_width = op.get("stroke_width", 2.0)

                stroke_rgb = hex_to_rgb_float(stroke_hex)
                fill_rgb = hex_to_rgb_float(fill_hex) if fill_hex else None

                shape = page.new_shape()
                bbox_dict = op.get("bbox")

                if shape_type in ["rectangle", "circle"] and bbox_dict:
                    rect = fitz.Rect(bbox_dict["x0"], bbox_dict["y0"], bbox_dict["x1"], bbox_dict["y1"])
                    if shape_type == "circle":
                        shape.draw_oval(rect)
                    else:
                        shape.draw_rect(rect)
                elif shape_type in ["line", "arrow"]:
                    sp = op.get("start_point", [50, 50])
                    ep = op.get("end_point", [150, 150])
                    p1 = fitz.Point(sp[0], sp[1])
                    p2 = fitz.Point(ep[0], ep[1])
                    shape.draw_line(p1, p2)
                    if shape_type == "arrow":
                        import math
                        angle = math.atan2(p2.y - p1.y, p2.x - p1.x)
                        arrow_len = 10.0
                        a1 = fitz.Point(p2.x - arrow_len * math.cos(angle - math.pi/6), p2.y - arrow_len * math.sin(angle - math.pi/6))
                        a2 = fitz.Point(p2.x - arrow_len * math.cos(angle + math.pi/6), p2.y - arrow_len * math.sin(angle + math.pi/6))
                        shape.draw_line(p2, a1)
                        shape.draw_line(p2, a2)

                shape.finish(color=stroke_rgb, fill=fill_rgb, width=stroke_width)
                shape.commit()

            elif op_type == "redact_region":
                bbox_dict = op.get("bbox")
                fill_hex = op.get("fill_color_hex", "#000000")
                fill_rgb = hex_to_rgb_float(fill_hex)
                if bbox_dict:
                    rect = fitz.Rect(bbox_dict["x0"], bbox_dict["y0"], bbox_dict["x1"], bbox_dict["y1"])
                    page.add_redact_annot(rect, fill=fill_rgb)
                    page.apply_redactions()

            elif op_type == "update_form_field":
                f_name = op.get("field_name")
                f_val = op.get("field_value", "")
                if f_name:
                    for widget in page.widgets():
                        if widget.field_name == f_name:
                            widget.field_value = f_val
                            widget.update()

            elif op_type == "delete_page":
                if 1 <= page_num <= len(doc):
                    doc.delete_page(page_num - 1)

            elif op_type == "rotate_page":
                angle = op.get("angle", 90)
                if page:
                    page.set_rotation((page.rotation + angle) % 360)

            elif op_type == "reorder_pages":
                new_order = op.get("new_page_order", [])
                if new_order and len(new_order) == len(doc):
                    zero_order = [p - 1 for p in new_order if 1 <= p <= len(doc)]
                    if len(zero_order) == len(doc):
                        doc.select(zero_order)

            elif op_type == "duplicate_page":
                if 1 <= page_num <= len(doc):
                    doc.fullcopy_page(page_num - 1)

            elif op_type == "add_blank_page":
                w = op.get("width", 612.0)
                h = op.get("height", 792.0)
                insert_idx = page_num - 1 if 1 <= page_num <= len(doc) else len(doc)
                doc.new_page(pno=insert_idx, width=w, height=h)

        doc.save(target_filepath, garbage=4, deflate=True)
        doc.close()
        return True
