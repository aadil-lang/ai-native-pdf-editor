from typing import List, Optional, Union, Any, Dict
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float

class PDFFontResource(BaseModel):
    pdf_name: str
    base_name: str
    family: str
    variant: str = "Regular"
    is_subset: bool = False
    is_embedded: bool = True
    source: str = "embedded"  # embedded, system, standard, fallback
    available_for_editing: bool = True

class PDFTextSpan(BaseModel):
    id: str
    page_number: int
    text: str
    bbox: BoundingBox
    font_name: Optional[str] = "Helvetica"
    font_family: Optional[str] = "Helvetica"
    font_variant: Optional[str] = "Regular"
    pdf_font_resource: Optional[str] = None  # e.g., "ABCDEE+Aptos-Bold"
    font_size: float = 12.0
    color: str = "#000000"
    is_bold: bool = False
    is_italic: bool = False
    is_subset_font: bool = False
    font_fallback_used: Optional[str] = None
    text_align: str = "left"  # left, center, right, justify
    rotation: int = 0
    flags: int = 0

class PDFImageObject(BaseModel):
    id: str
    page_number: int
    bbox: BoundingBox
    width: float
    height: float
    rotation: int = 0
    opacity: float = 1.0
    ext: str = "png"
    image_index: int = 0

class PDFAnnotationObject(BaseModel):
    id: str
    page_number: int
    type: str  # highlight, underline, strikeout, stamp, freetext, ink, line, square, circle
    bbox: BoundingBox
    color: Optional[str] = "#ffff00"
    content: Optional[str] = None
    quads: Optional[List[List[float]]] = None

class PDFShapeObject(BaseModel):
    id: str
    page_number: int
    type: str  # rectangle, line, arrow, circle
    bbox: BoundingBox
    stroke_color: str = "#000000"
    fill_color: Optional[str] = None
    stroke_width: float = 1.0
    rotation: int = 0

class PDFFormFieldObject(BaseModel):
    id: str
    page_number: int
    name: str
    type: str  # text, checkbox, dropdown
    bbox: BoundingBox
    value: Optional[str] = ""
    options: Optional[List[str]] = []

class PDFSignatureObject(BaseModel):
    id: str
    page_number: int
    bbox: BoundingBox
    image_base64: str

class PDFPage(BaseModel):
    page_number: int # 1-indexed for user display
    width: float
    height: float
    rotation: int = 0
    spans: List[PDFTextSpan] = []
    images: List[PDFImageObject] = []
    annotations: List[PDFAnnotationObject] = []
    shapes: List[PDFShapeObject] = []
    form_fields: List[PDFFormFieldObject] = []
    signatures: List[PDFSignatureObject] = []

class PDFDocumentModel(BaseModel):
    id: str
    filename: str
    page_count: int
    current_revision_index: int
    pages: List[PDFPage] = []
    document_fonts: List[PDFFontResource] = []
