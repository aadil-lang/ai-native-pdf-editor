import uuid
from typing import List, Optional, Union, Dict, Any, Literal
from pydantic import BaseModel, Field
from app.schemas.document import BoundingBox

class BaseOperation(BaseModel):
    operation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    operation_type: str
    document_id: str
    page_number: int = 1  # 1-indexed

class ReplaceTextOperation(BaseOperation):
    operation_type: Literal["replace_text"] = "replace_text"
    target_text: str
    replacement_text: str
    case_sensitive: bool = False
    bbox: Optional[BoundingBox] = None
    font_size: Optional[float] = None
    font_name: Optional[str] = None
    color_hex: Optional[str] = None
    is_bold: Optional[bool] = None
    is_italic: Optional[bool] = None

class InsertTextOperation(BaseOperation):
    operation_type: Literal["insert_text"] = "insert_text"
    text: str
    x: float
    y: float
    font_size: float = 12.0
    font_name: str = "helv"
    color_hex: str = "#000000"
    is_bold: bool = False
    is_italic: bool = False

class DeleteTextOperation(BaseOperation):
    operation_type: Literal["delete_text"] = "delete_text"
    target_text: str
    bbox: Optional[BoundingBox] = None

class AddImageOperation(BaseOperation):
    operation_type: Literal["add_image"] = "add_image"
    image_base64: str
    x: float
    y: float
    width: float
    height: float

class MoveObjectOperation(BaseOperation):
    operation_type: Literal["move_object"] = "move_object"
    object_id: str
    object_type: str  # "text", "image", "shape", "signature"
    new_x: float
    new_y: float
    original_bbox: Optional[BoundingBox] = None

class ResizeObjectOperation(BaseOperation):
    operation_type: Literal["resize_object"] = "resize_object"
    object_id: str
    object_type: str  # "image", "shape", "signature"
    new_width: float
    new_height: float
    original_bbox: Optional[BoundingBox] = None

class AddAnnotationOperation(BaseOperation):
    operation_type: Literal["add_annotation"] = "add_annotation"
    annotation_type: str
    bbox: BoundingBox
    color_hex: str = "#ffff00"

class AddShapeOperation(BaseOperation):
    operation_type: Literal["add_shape"] = "add_shape"
    shape_type: str  # "rectangle", "line", "arrow", "circle"
    bbox: Optional[BoundingBox] = None
    start_point: Optional[List[float]] = None
    end_point: Optional[List[float]] = None
    stroke_color_hex: str = "#000000"
    fill_color_hex: Optional[str] = None
    stroke_width: float = 2.0

class HighlightTextOperation(BaseOperation):
    operation_type: Literal["highlight_text"] = "highlight_text"
    target_text: Optional[str] = None
    bbox: Optional[BoundingBox] = None
    color_hex: str = "#ffff00"

class RedactRegionOperation(BaseOperation):
    operation_type: Literal["redact_region"] = "redact_region"
    bbox: BoundingBox
    fill_color_hex: str = "#000000"

class DeletePageOperation(BaseOperation):
    operation_type: Literal["delete_page"] = "delete_page"

class RotatePageOperation(BaseOperation):
    operation_type: Literal["rotate_page"] = "rotate_page"
    angle: int

class ReorderPagesOperation(BaseOperation):
    operation_type: Literal["reorder_pages"] = "reorder_pages"
    new_page_order: List[int]

class DuplicatePageOperation(BaseOperation):
    operation_type: Literal["duplicate_page"] = "duplicate_page"

class AddBlankPageOperation(BaseOperation):
    operation_type: Literal["add_blank_page"] = "add_blank_page"
    width: float = 612.0
    height: float = 792.0

class AddSignatureOperation(BaseOperation):
    operation_type: Literal["add_signature"] = "add_signature"
    image_base64: str
    x: float
    y: float
    width: float = 150.0
    height: float = 60.0

class UpdateFormFieldOperation(BaseOperation):
    operation_type: Literal["update_form_field"] = "update_form_field"
    field_name: str
    field_value: str

class EditOperationList(BaseModel):
    document_id: str
    operations: List[Dict[str, Any]]
