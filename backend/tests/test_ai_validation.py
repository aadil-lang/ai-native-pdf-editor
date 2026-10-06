import pytest
from app.validation.operation_validator import OperationValidator

def test_invalid_operation_type_rejected():
    ops = [{"operation_type": "execute_arbitrary_script", "code": "import os; os.system('ls')"}]
    is_valid, errors, validated = OperationValidator.validate_operations(ops, page_count=5)
    assert is_valid is False
    assert len(errors) > 0
    assert len(validated) == 0

def test_negative_page_number_rejected():
    ops = [{"operation_type": "delete_page", "page_number": -999}]
    is_valid, errors, validated = OperationValidator.validate_operations(ops, page_count=5)
    assert is_valid is False
    assert len(errors) > 0

def test_page_number_out_of_bounds_rejected():
    ops = [{"operation_type": "rotate_page", "page_number": 10, "angle": 90}]
    is_valid, errors, validated = OperationValidator.validate_operations(ops, page_count=3)
    assert is_valid is False
    assert len(errors) > 0

def test_valid_replace_text_accepted():
    ops = [
        {
            "operation_type": "replace_text",
            "page_number": 1,
            "target_text": "2025",
            "replacement_text": "2026"
        }
    ]
    is_valid, errors, validated = OperationValidator.validate_operations(ops, page_count=3)
    assert is_valid is True
    assert len(errors) == 0
    assert len(validated) == 1
