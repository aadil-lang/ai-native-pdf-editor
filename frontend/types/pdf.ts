export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface PDFFontResource {
  pdf_name: string;
  base_name: string;
  family: string;
  variant: string;
  is_subset: boolean;
  is_embedded: boolean;
  source: 'embedded' | 'system' | 'standard' | 'fallback';
  available_for_editing: boolean;
}

export interface PDFTextSpan {
  id: string;
  page_number: number;
  text: string;
  bbox: BoundingBox;
  font_name?: string;
  font_family?: string;
  font_variant?: string;
  pdf_font_resource?: string;
  font_size: number;
  color: string;
  is_bold?: boolean;
  is_italic?: boolean;
  is_subset_font?: boolean;
  font_fallback_used?: string;
  text_align?: 'left' | 'center' | 'right' | 'justify';
  rotation?: number;
  flags?: number;
}

export interface PDFImageObject {
  id: string;
  page_number: number;
  bbox: BoundingBox;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  ext?: string;
  image_index?: number;
}

export interface PDFAnnotationObject {
  id: string;
  page_number: number;
  type: string;
  bbox: BoundingBox;
  color?: string;
  content?: string;
}

export interface PDFShapeObject {
  id: string;
  page_number: number;
  type: string;
  bbox: BoundingBox;
  stroke_color: string;
  fill_color?: string;
  stroke_width: number;
  rotation?: number;
}

export interface PDFFormFieldObject {
  id: string;
  page_number: number;
  name: string;
  type: 'text' | 'checkbox' | 'dropdown';
  bbox: BoundingBox;
  value?: string;
  options?: string[];
}

export interface PDFSignatureObject {
  id: string;
  page_number: number;
  bbox: BoundingBox;
  image_base64: string;
}

export interface PDFPage {
  page_number: number;
  width: number;
  height: number;
  rotation: number;
  spans: PDFTextSpan[];
  images: PDFImageObject[];
  annotations: PDFAnnotationObject[];
  shapes: PDFShapeObject[];
  form_fields?: PDFFormFieldObject[];
  signatures?: PDFSignatureObject[];
}

export interface PDFDocumentModel {
  id: string;
  filename: string;
  page_count: number;
  current_revision_index: number;
  pages: PDFPage[];
  document_fonts?: PDFFontResource[];
}
