from typing import List, Dict, Any, Tuple
from app.schemas.operations import BaseOperation

class OperationValidator:
    @staticmethod
    def validate_operations(operations: List[Dict[str, Any]], page_count: int) -> Tuple[bool, List[str], List[Dict[str, Any]]]:
        """
        Validates raw operation dicts received from API or AI against bounds, types, and required parameters.
        Returns (is_valid, list_of_error_messages, list_of_validated_operations).
        """
        errors = []
        validated = []

        valid_types = {
            "replace_text", "insert_text", "delete_text", "add_image", "move_object",
            "resize_object", "add_annotation", "add_shape", "highlight_text",
            "redact_region", "delete_page", "rotate_page", "reorder_pages",
            "duplicate_page", "add_blank_page", "add_signature", "update_form_field"
        }

        for idx, op in enumerate(operations):
            op_type = op.get("operation_type")
            if not op_type or op_type not in valid_types:
                errors.append(f"Operation #{idx+1}: Unknown or missing operation_type '{op_type}'")
                continue

            page_num = op.get("page_number", 1)
            if op_type != "reorder_pages" and (not isinstance(page_num, int) or page_num < 1 or page_num > page_count + 1):
                errors.append(f"Operation #{idx+1} ({op_type}): page_number {page_num} out of bounds (1 to {page_count})")
                continue

            if op_type == "replace_text":
                if not op.get("target_text") and not op.get("bbox"):
                    errors.append(f"Operation #{idx+1} (replace_text): requires target_text or bbox")
                    continue
                if op.get("replacement_text") is None:
                    errors.append(f"Operation #{idx+1} (replace_text): missing replacement_text")
                    continue

            elif op_type == "insert_text":
                if not op.get("text"):
                    errors.append(f"Operation #{idx+1} (insert_text): missing text")
                    continue

            elif op_type == "add_image":
                if not op.get("image_base64"):
                    errors.append(f"Operation #{idx+1} (add_image): missing image_base64")
                    continue

            elif op_type == "reorder_pages":
                new_order = op.get("new_page_order", [])
                if not isinstance(new_order, list) or len(new_order) != page_count:
                    errors.append(f"Operation #{idx+1} (reorder_pages): new_page_order length must equal page_count ({page_count})")
                    continue

            validated.append(op)

        is_valid = len(errors) == 0 and len(validated) > 0
        return is_valid, errors, validated
