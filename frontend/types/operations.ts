import { BoundingBox } from './pdf';

export type OperationType =
  | 'replace_text'
  | 'insert_text'
  | 'delete_text'
  | 'add_image'
  | 'move_object'
  | 'resize_object'
  | 'add_annotation'
  | 'add_shape'
  | 'highlight_text'
  | 'redact_region'
  | 'delete_page'
  | 'rotate_page'
  | 'reorder_pages'
  | 'duplicate_page'
  | 'add_blank_page'
  | 'add_signature'
  | 'update_form_field';

export interface EditOperation {
  operation_id?: string;
  operation_type: OperationType;
  document_id?: string;
  page_number?: number;
  target_text?: string;
  replacement_text?: string;
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  font_size?: number;
  font_name?: string;
  font_family?: string;
  is_bold?: boolean;
  is_italic?: boolean;
  color_hex?: string;
  image_base64?: string;
  annotation_type?: string;
  shape_type?: 'rectangle' | 'line' | 'arrow' | 'circle';
  stroke_color_hex?: string;
  fill_color_hex?: string;
  stroke_width?: number;
  angle?: number;
  new_page_order?: number[];
  bbox?: BoundingBox;
  start_point?: [number, number];
  end_point?: [number, number];
  field_name?: string;
  field_value?: string;
  object_id?: string;
  object_type?: string;
  new_x?: number;
  new_y?: number;
  new_width?: number;
  new_height?: number;
  original_bbox?: BoundingBox;
}

export interface AIProposal {
  summary: string;
  requires_approval: boolean;
  operations: EditOperation[];
}
